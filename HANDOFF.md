# Lumio / assistBot HANDOFF

Sana: 2026-07-20  
Repository: `/var/www/assistBot`  
Branch: `feature/problem-enrichment`  
HEAD: `abe8146` (`feat(ai): model fallback (Claude->Gemini) + cache hit-rate + cost fixes`)

## Holat belgilari

- **Bajarildi**: kodda mavjud va kamida typecheck/build yoki tegishli test bilan tekshirilgan.
- **Qisman bajarildi**: bir qismi ishlaydi, lekin acceptance yoki end-to-end tekshiruv tugamagan.
- **Bajarilmadi**: repositoryda yo'q yoki runtime oqimiga ulanmagan.
- **Ataylab olib tashlangan**: userning oxirgi arxitektura qarori bo'yicha ishlatilmaydi.

## 1. Loyiha maqsadi va stack

Lumio Telegram orqali mavzu, til, slayd soni, titul va theme tanlab, AI yordamida akademik taqdimot yaratadi. Natija Telegram orqali PDF va PPTX ko'rinishida yuboriladi.

Asosiy stack:

- Node.js 20+, TypeScript, NestJS 11.
- Telegram bot: `grammy`.
- Queue: BullMQ + Redis.
- Database: PostgreSQL + Prisma.
- AI provider abstraction: Anthropic, OpenRouter, Gemini; productionda OpenRouter.
- Structured output: JSON mode + Zod.
- PDF/HTML render: Puppeteer.
- PPTX: PptxGenJS; production defaulti `hybrid`.
- Process manager: PM2, alohida bot va worker process.
- Logging: `nestjs-pino`.
- Test: Jest 29 + ts-jest.

## 2. Haqiqiy repository tuzilishi

```text
/
|- prisma/
|  |- schema.prisma
|  `- seed.ts
|- scripts/
|  |- qa-overflow.ts
|  |- queue-status.js
|  |- render-json-pdf.ts
|  `- safe-deploy.sh
|- src/
|  |- common/
|  |  |- config/              env validation, role va typed configuration
|  |  `- filters/
|  |- infra/
|  |  |- prisma/
|  |  |- queue/
|  |  `- redis/
|  |- modules/
|  |  |- ai/                  providerlar, LLM service, prompt va schemalar
|  |  |- bot/                 grammY bot, FSM, handler va keyboardlar
|  |  |- generation/          topic plan/outline/brief/cards processorlari
|  |  |- image-lab/           alohida image model test UI/API
|  |  |- presentations/       presentation/job/export persistence
|  |  |- ratelimit/           daily/inflight/global Redis guard
|  |  |- render/              HTML/PDF/PPTX va theme rendererlar
|  |  |- slides/
|  |  |- themes/
|  |  |- users/
|  |  `- visuals/             eski visual servislar; deck pipelinega ulanmagan
|  |- app.module.ts
|  `- main.ts
|- ecosystem.config.js
|- package.json
|- jest.config.js
|- eslint.config.mjs
|- tsconfig.json
`- .env                     gitga kiritilmagan, secretlarni saqlaydi
```

Muhim persistence modeli:

- `Presentation.outline`: outline JSON.
- `Slide.layout`: layout varianti emas, slide **type** (`CONTENT`, `STATS`, ...).
- `Slide.content`: AI card JSON; dekorativ variant `content.layout` ichida saqlanadi.
- `GenerationJob`: model, input/output/total token va taxminiy cost.
- `Export`: PDF/PPTX Telegram `file_id` va hajmi.

## 3. Pipeline

### 3.1 Topic plan - **Bajarildi**

`OutlineService.generate()` avval topic planner chaqiradi:

1. Topic turi, explanation mode va density aniqlanadi.
2. Aniq slide-type sequence tanlanadi.
3. `TITLE` birinchi, `CLOSING` oxirgi bo'lishi va yonma-yon duplicate type bo'lmasligi schema bilan tekshiriladi.

Fayllar:

- `src/modules/ai/prompts/topic-plan.prompt.ts`
- `src/modules/ai/schemas/topic-plan.schema.ts`
- `src/modules/generation/outline.service.ts`

### 3.2 Outline - **Bajarildi**

Topic plan outline promptga `PLANNER_GUIDANCE` sifatida beriladi. Outline model title va `key_points` yozadi; `applyPlannedTypes()` model tanlagan typelarni planner sequence bilan qayta bir xil qiladi.

Outline userga ko'rsatiladi va confirm/edit/regenerate bosqichi bor.

Fayllar:

- `src/modules/ai/prompts/outline.prompt.ts`
- `src/modules/ai/schemas/outline.schema.ts`
- `src/modules/generation/outline.service.ts`
- `src/modules/generation/outline.processor.ts`
- `src/modules/generation/outline.formatter.ts`

### 3.3 Brief - **Bajarildi**

Outline confirm qilingandan keyin `CardsProcessor` bir marta deck brief yaratadi:

- `thesis`
- `narrative`
- `keyFacts`
- har position uchun `slideFocus`
- optional `terms`, `sourceNeeds`, `contentDepth`, `visualStrategy`, `renderIntent`

Runtime cards hozir faqat `thesis`, `narrative`, `keyFacts` va `slideFocus`dan foydalanadi. Optional V2 fieldlar hali consumerga ulanmagan.

Fayllar:

- `src/modules/ai/prompts/brief.prompt.ts`
- `src/modules/ai/schemas/brief.schema.ts`
- `src/modules/generation/brief.service.ts`
- `src/modules/generation/cards.processor.ts`

### 3.4 Cards - **Bajarildi, lekin contract ataylab yumshatilgan**

- Har slide uchun alohida AI JSON call.
- `CARD_CONCURRENCY = 3`.
- Deck context: title/topic/language/thesis/narrative/shared facts va butun outline.
- Per-slide context: position/type/title/key points/slide focus va aynan shu type uchun structure + few-shot example.
- `cards` va ayrim typelar uchun `prose` mode mavjud.
- `TITLE` titul ma'lumoti bilan deterministic yig'iladi.
- Theme/content shape asosida deterministic dekorativ layout variant tanlanadi.
- `DeckState` bir deck ichida bir xil variantning monoton takrorlanishini kamaytiradi.

Muhim: runtime `CardService` `cardSchemaByType`ni ishlatmaydi. U faqat:

```ts
z.record(z.unknown())
```

bilan top-level JSON object ekanini tekshiradi. Bu userning "AI JSON -> to'g'ridan-to'g'ri render" qarori asosida qilingan. `card.schemas.ts`dagi qat'iy schemalar runtime card generationga ulanmagan.

### 3.5 Repair - **Ataylab olib tashlangan**

Hozir quyidagilar yo'q:

- invalid card uchun retry;
- targeted field repair;
- full-card fallback;
- AI condensation;
- deterministic truncation;
- post-render overflow repair;
- provider/model fallback.

`LlmService` bitta call qiladi. JSON parse yoki active schema parse muvaffaqiyatsiz bo'lsa job fail bo'ladi. Topic plan, outline va brief hali qat'iy schema ishlatadi; cards faqat object contract ishlatadi.

### 3.6 Renderer/export - **Bajarildi**

1. `SlidesService.replaceAll()` selected type/contentni DBga yozadi.
2. Render queue bitta attempt bilan ishga tushadi.
3. Theme bo'yicha HTML engine tanlanadi:
   - `modern_academic` -> academic, 1920x1080.
   - `premium_academic` -> premium/nafis, 1280x720.
   - `soft_curves_research` -> soft curves, 1280x720.
   - qolgan theme -> classic templates, 1280x720.
4. Puppeteer PDF yaratadi va Telegramga yuboradi.
5. Shu HTML/slides asosida hybrid PPTX yaratiladi va yuboriladi.

Unknown theme/type va renderer ichidagi xato endi fallback qilinmaydi; render job fail bo'ladi.

## 4. Model va konfiguratsiya

Productionga tegishli non-secret qiymatlar:

| Bosqich | Provider/model | Konfiguratsiya |
|---|---|---|
| Topic plan | OpenRouter / `qwen/qwen3.6-35b-a3b` | JSON mode, temperature `0.7`, reasoning off |
| Outline | OpenRouter / `qwen/qwen3.6-35b-a3b` | JSON mode, temperature `0.7`, reasoning off |
| Brief | OpenRouter / `qwen/qwen3.6-35b-a3b` | outline modelni reuse qiladi |
| Cards | OpenRouter / `qwen/qwen3.7-plus` | JSON mode, temperature `0.7`, reasoning off |
| Repair | yo'q | ataylab olib tashlangan |
| Render | AI ishlatmaydi | Puppeteer + PptxGenJS |

Qo'shimcha:

- `AI_REQUEST_TIMEOUT_MS=45000`.
- Response cache yoqilgan, TTL 604800 soniya (7 kun).
- Cache key provider + model + system + deck context + user prompt hashidan yaratiladi.
- Cache hit token/costni `0` qilib qaytaradi.
- OpenRouter requestda `top_p` va `max_tokens` berilmaydi.
- Reasoning `qwen/qwen3.6-35b-a3b`, `qwen/qwen3.7-plus` va `deepseek/deepseek-v4-flash` uchun o'chiriladi.
- Qwen 3.7 Plus minimal JSON live testida reasoning off holatida 58 token, 0 reasoning token va valid JSON qaytdi.
- `kaa` uchun `LANGUAGE_MODEL_OVERRIDE = claude-sonnet-5` mavjud. Bu OpenRouter slug sifatida alohida tekshirilmagan va risk hisoblanadi.
- `.env`dagi `NODE_ENV=development`, lekin PM2 har process uchun `NODE_ENV=production` override qiladi.

## 5. Aniqlangan muammolar va sabablar

1. **Card job schema xatosi** - **Tuzatildi**  
   `paragraph` 650 belgidan oshganda qat'iy Zod schema jobni to'xtatgan. Runtime card schema top-level objectga yumshatildi.

2. **Noto'g'ri OpenRouter model slug** - **Tuzatildi**  
   Eski Qwen slug providerda mavjud emas edi. Keyin valid sluglar bilan live JSON smoke test qilindi.

3. **Card reasoning tokenlari ko'p sarflanishi** - **Tuzatildi**  
   Qwen 3.7 Plus trivial testda 388 reasoning token ishlatgan. Card JSON call uchun reasoning o'chirildi: total 467 -> 58 token.

4. **Matnning yarmidan kesilishi yoki yashirin qolishi** - **Asosiy kesuvchi qatlamlar olib tashlandi**  
   Renderer `.slice()` limitlari, PPTX text-fit/truncate va render repair qatlamlari olib tashlangan. Prose column split matnni yo'qotmaydi; faqat sentence/word boundary bo'yicha ikki qismga ajratadi.

5. **Rasm mavzuga mos kelmasligi** - **Pipeline'dan olib tashlandi**  
   Wikimedia/topic visual enrichment CardsProcessor va GenerationModule'dan uzilgan. Eski visual fayllarning bir qismi repositoryda qolgan, lekin deck generation ularni chaqirmaydi.

6. **VPS/bot qotishi** - **Qisman tuzatildi**  
   Bot va worker alohida PM2 process. BullMQ presentation concurrency `1`, global Redis generation slot default `1`, per-user in-flight lock mavjud. Card ichki API concurrency esa `3`.

7. **Sekin generatsiya** - **Qisman tuzatildi**  
   Sabab: topic plan + outline + brief + N card call + PDF + PPTX. Cardlar 3 tadan parallel, response cache bor, Qwen reasoning o'chirilgan. Yangi model bilan to'liq deck latency hali o'lchanmagan.

8. **CONTENT/DEFINITION bir xil ko'rinishi** - **Dizayn variantlari qo'shilgan**  
   Dark premium, premium academic va soft curves uchun alohida content/definition variantlari va anti-monotony selection qo'shilgan.

9. **Layout/type mismatch** - **Qisman tuzatildi, risk qolgan**  
   `Slide.layout` type sifatida saqlanadi; `content.layout` variant sifatida. Selection deterministic. Ammo card shape runtime strict tekshirilmagani sabab AI required fieldni tashlab ketsa renderer xato berishi mumkin.

10. **Lint ishlamasligi** - **Bajarilmadi**  
    ESLint flat config TypeScript parser va Jest globalsni sozlamagan. Natijada TypeScript parsing/global xatolari chiqadi; bu typecheck xatosi emas.

## 6. Qabul qilingan arxitektura qarorlari

- Bot va worker alohida process; faqat bot Telegram long polling qiladi.
- BullMQ job retries/fallbacklar `attempts: 1`.
- Bir serverda bir presentation pipeline; bir deck ichida 3 card call parallel.
- LLM provider fallback va repair olib tashlangan.
- Card JSON content strict schema bilan bloklanmaydi.
- Topic plan, outline va brief strict contractda qolgan.
- Image enrichment deck pipeline'dan olib tashlangan.
- Slide type semantic tanlovi AI topic plannerga, dekorativ variant tanlovi deterministic codega tegishli.
- `AIM_TASKS` active `SLIDE_TYPES`dan olib tashlangan, lekin eski DB decklarini render qilish uchun rendererlar saqlangan.
- PDF va PPTX bir xil saqlangan slide data va selected template asosida yaratiladi.
- PPTX mode faqat `hybrid | pixelPerfect`; editable legacy pipeline olib tashlangan.
- Unknown type/theme yoki malformed render data yashirilmaydi; xato explicit fail qiladi.
- Exact AI response cache saqlangan; prompt/model o'zgarsa key ham o'zgaradi.

## 7. O'zgartirilgan fayllar

### 7.1 Oxirgi Qwen 3.7 Plus ishida aniq o'zgargan

- `.env` - `AI_CARD_MODEL` `qwen/qwen3.7-plus`ga almashtirildi; secret qiymatlar o'zgartirilmagan.
- `src/modules/ai/openrouter.provider.ts` - Qwen 3.7 Plus uchun reasoning off.
- `src/modules/ai/openrouter.provider.spec.ts` - reasoning off regression testi.
- `src/modules/ai/model-pricing.ts` - Qwen 3.7 Plus narxi qo'shildi.
- `src/modules/ai/model-pricing.spec.ts` - pricing regression testi.

### 7.2 HEADga nisbatan oldingi chatlarda yig'ilgan tracked diff

Gitda bu ishlar uchun alohida clean checkpoint yo'q. Quyidagi fayllar HEADga nisbatan dirty; ularni user/Claude/Codex bo'yicha aniq ajratib bo'lmaydi.

Platform/config:

- `ecosystem.config.js` - PM2 bot/worker process konfiguratsiyasi format va shutdown/memory sozlamalari.
- `package.json` - queue/deploy scriptlari va Jest dev dependencylar.
- `pnpm-lock.yaml` - dependency lock yangilanishi.
- `src/app.module.ts` - `ImageLabModule` ulangan.
- `src/common/config/configuration.ts` - admin, global concurrency, response cache, timeout, image-lab config.
- `src/common/config/env.validation.ts` - yuqoridagi env contractlar; fallback envlari olib tashlangan.
- `src/infra/queue/queue.module.ts` - default attempts 3 -> 1, backoff olib tashlangan.
- `src/infra/queue/queue.types.ts` - `fullTypesShowcase` optional flag.
- `src/main.ts` - worker localhostga, bot barcha interfacelarga bind qiladi.
- `tsconfig.json` - `scripts` compile scope'dan chiqarilgan.

AI:

- `src/modules/ai/ai.module.ts` - provider fallback DI olib tashlangan.
- `src/modules/ai/anthropic.provider.ts` - configurable 45s timeout.
- `src/modules/ai/gemini.provider.ts` - configurable 45s timeout.
- `src/modules/ai/layout.catalog.ts` - active type 18 ta; `AIM_TASKS` olib tashlangan; language guide/override.
- `src/modules/ai/llm.service.ts` - one-call flow, Redis response cache, cost; retry/repair/fallback olib tashlangan.
- `src/modules/ai/llm.types.ts` - `costUsd`; fallback contractlari olib tashlangan.
- `src/modules/ai/model-pricing.ts` - OpenRouter/OpenAI/Gemini/Qwen/DeepSeek pricing.
- `src/modules/ai/openrouter.provider.ts` - OpenRouter headers, timeout, reasoning policy.
- `src/modules/ai/prompts/card.prompt.prose.ts` - prose type specs; `AIM_TASKS` olib tashlangan.
- `src/modules/ai/prompts/card.prompt.ts` - complete-sentence/content budgets, STATS/PROCESS/problem-solution specs, `AIM_TASKS` removal.
- `src/modules/ai/prompts/outline.prompt.ts` - planner guidance va duplicate CONTENT/DEFINITION guidance.
- `src/modules/ai/schemas/brief.schema.ts` - optional V2 brief metadata.
- `src/modules/ai/schemas/card.schemas.ts` - complete-sentence helper, density bounds, `AIM_TASKS` removal; runtimega ulanmagan.
- `src/modules/ai/schemas/outline.schema.ts` - exact key points va short-deck ritual check.
- `src/modules/ai/uzbek-script.sanitizer.ts` - **o'chirilgan**; postprocess ishlamaydi.

Bot:

- `src/modules/bot/bot.constants.ts` - `/fulltypes` FSM states.
- `src/modules/bot/bot.module.ts` - `FullTypesHandler`.
- `src/modules/bot/bot.service.ts` - `/fulltypes` command/callback registration.
- `src/modules/bot/bot.types.ts` - fulltypes context.
- `src/modules/bot/handlers/callback.handler.ts` - global/admin limit va attempts 1.
- `src/modules/bot/handlers/message.handler.ts` - fulltypes topic/theme state.
- `src/modules/bot/testslide.catalog.json` - `AIM_TASKS` fixture olib tashlangan.

Generation:

- `src/modules/generation/brief.service.ts` - sanitizer postprocess olib tashlangan.
- `src/modules/generation/card.service.ts` - direct object schema; strict per-type schema/repair/sanitizer olib tashlangan.
- `src/modules/generation/cards.processor.ts` - direct card flow, no fallback/image/quality guard, deterministic layouts, progress, attempts 1.
- `src/modules/generation/generation.module.ts` - visual services pipeline'dan uzilgan.
- `src/modules/generation/outline.formatter.ts` - `AIM_TASKS` edit ro'yxatidan olib tashlangan.
- `src/modules/generation/outline.processor.ts` - progress/error classification/cost.
- `src/modules/generation/outline.service.ts` - topic plan + outline ikki call; old normalize/fallback olib tashlangan.

Rate limit/queue:

- `src/modules/ratelimit/rate-limit.service.ts` - atomic daily + per-user in-flight + global slot; admin daily bypass.

Render:

- `src/modules/render/academic/deck.ts` - visual/unknown-type fallback olib tashlangan.
- `src/modules/render/academic/slides.ts` - image branches va array slicing olib tashlangan; barcha data render qilinadi.
- `src/modules/render/browser.service.ts` - lazy single browser launch/reconnect.
- `src/modules/render/pptx/pptx.builder.ts` - **o'chirilgan** legacy builder.
- `src/modules/render/pptx/pptx.draw.ts` - text fit/truncate va per-box swallow olib tashlangan.
- `src/modules/render/pptx/pptx.editable.ts` - **o'chirilgan** editable pipeline.
- `src/modules/render/pptx/pptx.hybrid.ts` - fit policy olib tashlangan.
- `src/modules/render/pptx/pptx.layout.ts` - direct hybrid contract.
- `src/modules/render/pptx/pptx.text-fit.ts` - **o'chirilgan** shrink/truncate.
- `src/modules/render/premium_academic/deck.ts` - unknown type fallback olib tashlangan.
- `src/modules/render/premium_academic/slides.ts` - Nafis layout/font/content variantlari va slicing removal.
- `src/modules/render/premium_academic/tokens.ts` - typography/spacing rang tokenlari.
- `src/modules/render/render-contract.ts` - **o'chirilgan** render contract warning layer.
- `src/modules/render/render.processor.ts` - direct PDF -> PPTX flow, progress, no PPTX fallback.
- `src/modules/render/render.service.ts` - fit/contract/editable fallback olib tashlangan; hybrid/pixelPerfect only.
- `src/modules/render/soft_curves/deck.ts` - direct type dispatch.
- `src/modules/render/soft_curves/slides.ts` - Soft Curves content/definition/design va slicing removal.
- `src/modules/render/templates/deck.ts` - unknown type/theme fail; no visual CSS.
- `src/modules/render/templates/document.ts` - katta dark-premium CSS/typography/layout yangilanishlari.
- `src/modules/render/templates/layout-registry.ts` - theme/content-shape/anti-monotony variant selection.
- `src/modules/render/templates/layouts.ts` - dark-premium unique layouts, prose split, full data rendering.
- `src/modules/render/templates/wikimedia-visual.ts` - **o'chirilgan**.

Visuals:

- `src/modules/visuals/topic-visual.service.ts` - **o'chirilgan**.
- `src/modules/visuals/visual.policy.ts` - prose visual candidate exclusion; hozir pipelinega ulanmagan.
- `src/modules/visuals/visual.types.ts` - provider union yangilangan.
- `src/modules/visuals/wikimedia.service.ts` - `enrichSlides()` no-op; hozir pipelinega ulanmagan.

### 7.3 Untracked source/tooling

- `.env.example` - non-secret config namunasi.
- `jest.config.js` - ts-jest test config.
- `scripts/qa-overflow.ts` - eski QA helper.
- `scripts/queue-status.js` - BullMQ status.
- `scripts/render-json-pdf.ts` - JSONdan lokal PDF.
- `scripts/safe-deploy.sh` - builddan keyin PM2 reload.
- `src/common/config/role.spec.ts`
- `src/infra/queue/worker-options.ts`
- `src/modules/ai/cache-stats.service.spec.ts`
- `src/modules/ai/content-budgets.ts`
- `src/modules/ai/llm.service.spec.ts`
- `src/modules/ai/model-pricing.spec.ts`
- `src/modules/ai/openrouter.provider.spec.ts`
- `src/modules/ai/prompts/topic-plan.prompt.ts`
- `src/modules/ai/schemas/card.schemas.spec.ts`
- `src/modules/ai/schemas/topic-plan.schema.ts`
- `src/modules/ai/schemas/topic-plan.schema.spec.ts`
- `src/modules/bot/handlers/fulltypes.handler.ts`
- `src/modules/image-lab/*`
- `src/modules/ratelimit/rate-limit.service.spec.ts`
- `src/modules/render/templates/layout-registry.spec.ts`
- `src/modules/render/templates/layout-render-contract.spec.ts`

`previews/` ichida ko'p untracked PDF/PNG/JSON QA artefaktlari bor. Ular source emas va avtomatik o'chirilmasligi kerak.

## 8. Hali bajarilmagan vazifalar

1. **Qwen 3.7 Plus bilan real end-to-end deck testi** - **Bajarilmadi**. Faqat minimal OpenRouter JSON smoke test o'tgan.
2. **Generated JSON -> renderer field compatibility QA** - **Bajarilmadi**. Strict card schema olib tashlangani uchun eng katta runtime risk shu.
3. **Lint config repair** - **Bajarilmadi**.
4. **`pnpm test`, `pnpm typecheck`, `pnpm lint` scriptlari** - **Bajarilmadi**; package scriptlar to'liq emas.
5. **Eval harness (`eval:content`) va fixture metrics** - **Bajarilmadi**.
6. **EvidencePack / EvidenceItem / allowedEvidenceIds** - **Bajarilmadi**.
7. **DeckClaim ownership** - **Bajarilmadi**; `sharedFacts` hali ishlaydi.
8. **Planning simplification** - **Bajarilmadi**; topic plan, outline va brief uchta planning call/contract bo'lib qolgan.
9. **Targeted repair/condensation** - **Ataylab olib tashlangan**; user qarorisiz qayta qo'shilmasin.
10. **Real latency/cost comparison** - **Bajarilmadi**; Qwen 3.7 deck-level o'lchov kerak.
11. **Karakalpak OpenRouter model slug test** - **Bajarilmadi**.
12. **Old visual modules cleanup** - **Qisman**; runtimega ulanmagan, lekin dead/legacy source qolgan.

## 9. Test, typecheck, lint va build

2026-07-20 yakuniy tekshiruv:

### Test - **Muvaffaqiyatli**

```bash
./node_modules/.bin/jest --runInBand
```

Natija: 10 suite, 56 test, 56 passed.

### Typecheck - **Muvaffaqiyatli**

```bash
./node_modules/.bin/tsc --noEmit
```

Natija: exit 0.

### Build - **Muvaffaqiyatli**

```bash
./node_modules/.bin/nest build
```

Natija: exit 0, `dist/main.js` yaratildi.

### Lint - **Muvaffaqiyatsiz, tooling config sabab**

```bash
./node_modules/.bin/eslint "{src,test}/**/*.ts"
```

Natija: 189 error. Asosiy sabablar:

- TypeScript parser sozlanmagan (`@`, `interface`, type syntax parsing errors).
- Jest globals sozlanmagan (`describe`, `it`, `expect` no-undef).

### pnpm holati

Bu sessiyada `pnpm exec ...`:

```text
[ERROR] unable to open database file
```

berdi. Shu sabab mavjud `node_modules/.bin/*` ishlatildi. Bu application build xatosi emas, pnpm lokal metadata/store muammosi.

### Production

- `presentation-bot`: online.
- `presentation-worker`: online.
- Outline/cards/render queue: waiting 0, active 0, failed 0.

## 10. Git holati

- Branch: `feature/problem-enrichment`.
- HEAD: `abe8146`.
- Remote branch shu commitda.
- HEADga nisbatan: 66 tracked file dirty, 4213 insertions, 2803 deletions.
- Ko'p untracked source/test/script va `previews/` artefaktlari mavjud.
- `.env` tracked emas.
- Hech qanday commit qilinmagan.

### Userga tegishli oldindan mavjud o'zgarishlar

Ish boshlanganda worktree allaqachon katta hajmda dirty bo'lgan. Clean checkpoint yoki commit bo'lmagani uchun bulk diff ichida user, Claude Code va oldingi Codex o'zgarishlarini ishonchli ajratib bo'lmaydi. Ularni revert, reset yoki cleanup qilish mumkin emas.

### Aynan oxirgi model ishida kiritilgan o'zgarishlar

Ishonchli attribution faqat:

- `.env`
- `src/modules/ai/openrouter.provider.ts`
- `src/modules/ai/openrouter.provider.spec.ts`
- `src/modules/ai/model-pricing.ts`
- `src/modules/ai/model-pricing.spec.ts`

Qolgan dirty fayllar "pre-existing/earlier-session accumulated changes" sifatida qaralsin.

## 11. Muhim interface, schema va contractlar

- `AppConfig`, `Env`, `AppRole`.
- `OutlineJobData`, `CardsJobData`, `RenderJobData`.
- `LlmMessage`, `LlmUsage`, `LlmResult<T>`, `LlmChatResult`, `LlmProvider`.
- `TopicPlan`, `topicPlanSchema`, `buildTopicPlanSchema()`.
- `Outline`, `outlineSchema`, `buildOutlineSchema()`.
- `DeckBrief`, `briefSchema`, `buildBriefSchema()`.
- `CardInput`, `CardContent`.
- `cardSchemaByType`, `proseSchemaByType` - mavjud, lekin runtime `CardService` ishlatmaydi.
- `directCardSchema` - current runtime card contract.
- `SlideType`, `SLIDE_TYPES`, `SLIDE_GUIDE`.
- `DeckState`, `LayoutOption<T>`, `LAYOUT_REGISTRIES`, `selectLayout()`, `withSelectedLayout()`.
- `DeckSlide`.
- `PptxRenderMode`, `RenderPptxOptions`, `RenderPptxResult`.
- `PptxSlidePlan`, `PptxTextBox`, `PptxImageBox`, `PptxShapeBox`.
- `StartDecision`.
- Prisma: `PresentationStatus`, `SlideStatus`, `ExportFormat`, `JobStage`, `JobStatus`.

## 12. Keyingi chat birinchi bajaradigan vazifa

Kodga darhol tegmasin. Birinchi navbatda Qwen 3.7 Plus bilan bitta toza real deck generatsiyasini kuzatsin:

1. Test mavzu: `O'zbekistonda raqamli ta'lim: imkoniyatlar, muammolar va kelajak istiqbollari`.
2. Exact duplicate cache ta'sir qilmasligi uchun mavzuga noyob suffix yoki boshqa wording ishlatilsin.
3. Outline/cards/render job progress va PM2 worker logi yozib olinsin.
4. DBdan generated slide JSON, model, token, cost va latency olinsin.
5. Har slide uchun required renderer fieldlar borligi va PDF/PPTX muvaffaqiyatini tekshirsin.
6. Xato bo'lsa faqat dalilga asoslangan eng kichik fix taklif qilinsin; guard/repair/fallback user roziligisiz qayta qo'shilmasin.

## 13. O'zgartirilmasligi kerak bo'lgan backward compatibility

- `Slide.layout` slide type bo'lib qolishi kerak; variant `Slide.content.layout`.
- Old DB decklaridagi `AIM_TASKS` renderer orqali ochilishi kerak, active plannerga qaytarilmasin.
- `CardsJobData.contentMode` absent bo'lsa `cards`.
- `CardsJobData.fullTypesShowcase` optional bo'lib qolishi kerak.
- Brief V2 fieldlari optional/additive; eski brief shape ishlashi kerak.
- Title formal fieldlari optional; titul disabled bo'lsa topic-only title ishlashi kerak.
- Theme keylar o'zgarmasin: ayniqsa `dark_premium`, `premium_academic`, `soft_curves_research`, `modern_academic`.
- Academic canvas 1920x1080; classic/premium/soft canvas 1280x720.
- Bot process yagona Telegram long-poller; worker polling qilmasin.
- Worker port base port + 1 va localhostda qolishi kerak.
- PDF/PPTX bir xil saqlangan slides data asosida yaratilishi kerak.
- Userning dirty worktree fayllari reset/revert qilinmasin.
- Secretlar log, markdown, commit yoki test outputga yozilmasin.
- Retry/repair/fallback userning yangi aniq roziligisiz qayta yoqilmasin.

## 14. Ochiq savollar va qolgan risklar

1. Qwen 3.7 Plus real Uzbek cardlarni renderer kutgan field nomlarida qanchalik barqaror qaytaradi?
2. Strict card schema yo'qligida malformed object renderni qanchalik tez-tez yiqitadi?
3. `temperature=0.7` direct/no-retry pipeline uchun baland emasmi?
4. `CARD_CONCURRENCY=3`, lekin comment "two cards" deydi; comment va operational limit mos emas.
5. Topic plan + outline + brief sifati qo'shimcha latency/costga arziydimi?
6. `sharedFacts` evidence emas; fake stat/law/source riskini promptgina nazorat qiladi.
7. Response cache ayni topic/prompt/modelni qayta test qilganda yangi AI callni yashiradi.
8. PDF yuborilib bo'lgach PPTX yiqilsa, butun presentation `failed` bo'ladi va generic PDF error xabari chiqadi.
9. Renderer array slicing olib tashlangani sabab model juda ko'p item qaytarsa overflow xavfi bor.
10. PPTX text-fit olib tashlangan; hybrid screenshot vizualni saqlaydi, lekin overlay/metadata path alohida QA talab qiladi.
11. Visual legacy code dead source sifatida chalkashlik keltiradi.
12. ESLint ishlamagani CI/pre-commit sifat signalini yo'q qiladi.
13. `kaa -> claude-sonnet-5` OpenRouter slug mosligi tekshirilmagan.
14. `.env.example` joriy production model qiymatlaridan eski; onboardingda chalkashlik bo'lishi mumkin.

## CONTINUATION PROMPT

```text
Sen `/var/www/assistBot` repositorydagi Lumio Telegram presentation bot ustida ishlayapsan.

Avval `/var/www/assistBot/HANDOFF.md`ni to'liq o'qi va undagi "real holat", "backward compatibility" hamda "git ownership" qoidalariga qat'iy amal qil.

Hozirgi asosiy holat:
- provider: OpenRouter;
- topic plan/outline/brief: `qwen/qwen3.6-35b-a3b`;
- cards: `qwen/qwen3.7-plus`;
- Qwen reasoning JSON calllarda o'chirilgan;
- repair/retry/provider fallback/content truncation ataylab olib tashlangan;
- runtime card contract faqat top-level JSON object;
- bot va worker PM2da alohida va online;
- worktree juda dirty, user/old session o'zgarishlarini revert/reset qilma;
- secret yoki `.env` qiymatlarini chiqarma.

Birinchi vazifa:
1. Kodga tegmasdan Qwen 3.7 Plus bilan bitta yangi real end-to-end deck generationni kuzat.
2. Exact response cache hit bo'lmasligi uchun noyob test topic ishlat.
3. Outline/cards/render queue progress, PM2 worker log, generated slide JSON, token/cost/latency va PDF/PPTX natijasini to'pla.
4. Har slide content shape renderer kutgan fieldlarga mosligini tekshir.
5. Natijani dalillar bilan Uzbek tilida report qil.
6. Xato aniqlansa, avval sabab va minimal fixni ayt; user roziligisiz repair, fallback, guard yoki truncation qayta qo'shma.

Test mavzu bazasi:
"O'zbekistonda raqamli ta'lim: imkoniyatlar, muammolar va kelajak istiqbollari"
Uni cache'dan ajratish uchun mazmunini buzmasdan noyob suffix/wording qo'sh.
```
