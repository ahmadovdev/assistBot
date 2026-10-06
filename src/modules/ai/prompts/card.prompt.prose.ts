// card.prompt.prose.ts
// PROSE MODE — alternative to the card-based points/bullets structure in
// card.prompt.ts, for slide types whose content reads naturally as continuous
// explanation rather than a list. Additive only: card.prompt.ts's SPECS/
// CARD_SYSTEM are NOT modified — this file is consumed by resolveSpec()/
// buildCardSystem() in card.prompt.ts, selected only when contentMode==='prose'.
//
// Each spec keeps that type's own ANCHOR field (title/term — the element the
// render uses as its visual identity) and asks for ONE flowing paragraph
// instead of a points/items array. See card.schemas.ts for why this is NOT a
// single generic {heading, paragraph} shape shared across every type.
//
// FINDING/PROCESS are absent — their existing layouts
// (z_stack/kbd_chain) are discrete-item visuals; a prose variant needs its
// own dedicated render design first (deferred, tracked separately).

import { SlideType } from '../layout.catalog';

interface Spec { structure: string; example: string; }

/** Appended to CARD_SYSTEM (unmodified) only when contentMode==='prose' —
 *  see buildCardSystem() in card.prompt.ts. */
export const PROSE_SYSTEM_ADDENDUM = `
PROSE MODE — this slide's "paragraph" field must be ONE continuous, flowing
paragraph (not a list):
- STRICT BAN on list-signal structure: no numbering ("1)", "Birinchidan...
  Ikkinchidan..."), no bullet characters, no line breaks used as pseudo-bullets.
- Connect ideas with natural Uzbek academic connectors: "shu bilan birga",
  "bu o'z navbatida", "natijada", "buning ustiga", "shu sababli" — vary them,
  don't repeat the same connector twice.
- Each sentence must build on the one before it — reordering the sentences
  should break the meaning (a real logical chain, not interchangeable facts).
  This is the same depth/accuracy bar as card mode: true, well-established
  facts only, no invented specifics.
- Respect the paragraph's char range EXACTLY (given per field below) — this
  was verified against the real 1280x720 canvas and has comfortable margin,
  but is still a hard ceiling, not a target to maximize.
`;

export const PROSE_SPECS: Partial<Record<SlideType, Spec>> = {
  RELEVANCE: {
    structure: '{ "kicker"?: string (e.g. "Dolzarblik"), "title": string (an assertion: why this matters NOW, ≤80 chars), "paragraph": string (280-650 chars: ONE flowing paragraph explaining why the topic is relevant today — weave 2-3 reasons into a single argument, not a list), "source"?: string (short citation if a real figure is mentioned inline, max 70 chars) }',
    example: '{"kicker":"Dolzarblik","title":"Raqamli ta\'lim bugun har qachongidan dolzarb","paragraph":"Pandemiyadan so\'ng ta\'lim jarayoni tubdan raqamlashdi, natijada onlayn platformalar an\'anaviy darsni to\'ldiruvchi emas, balki tenglashtiruvchi asosiy vositaga aylandi. Bu o\'z navbatida talabalarning mustaqil ta\'lim ko\'nikmalariga bo\'lgan talabni keskin oshirdi, chunki endi bilim faqat auditoriyada emas, balki o\'quvchining o\'zini boshqarish qobiliyatiga bog\'liq holda shakllanmoqda. Shu sababli raqamli ta\'lim vositalarining samaradorligini o\'rganish nafaqat nazariy, balki amaliy zaruratga aylandi."}',
  },
  OBJECT_SUBJECT: {
    structure: '{ "kicker"?: string, "title": string (e.g. "Tadqiqot ob\'ekti va predmeti"), "paragraph": string (280-650 chars: ONE paragraph that first names the OBJECT — the broad area studied — then narrows naturally to the SUBJECT — the specific aspect examined; the narrowing itself should read as a logical step, e.g. "...bu keng doiradagi X. Ushbu tadqiqotning predmeti esa aynan shu doiradagi Y hisoblanadi.") }',
    example: '{"title":"Tadqiqot ob\'ekti va predmeti","paragraph":"Tadqiqot ob\'ekti sifatida oliy ta\'lim muassasalarida tashkil etilgan masofaviy ta\'lim jarayonining barcha jihatlari qaraladi — bu o\'ziga texnik infratuzilmadan tortib pedagogik metodikagacha keng doirani qamrab oladi. Ushbu keng doira ichida tadqiqotning predmeti esa aniqroq, ya\'ni raqamli platformalarning talabalar bilim o\'zlashtirish samaradorligiga ko\'rsatadigan ta\'siri bilan chegaralanadi."}',
  },
  CONTENT: {
    structure: '{ "kicker"?: string, "title": string (a full-sentence ASSERTION, ≤80 chars), "paragraph": string (280-650 chars: ONE flowing paragraph explaining and supporting the title\'s claim — cover the same ground 2-4 bullet points would, but as connected prose) }',
    example: '{"title":"Barglar yashil rangda ko\'rinishining sababi xlorofilning yorug\'lik yutish xususiyatida","paragraph":"Xlorofill pigmenti quyosh spektridagi qizil va ko\'k to\'lqin uzunliklarini samarali yutadi, chunki aynan shu energiya fotosintez reaksiyalarini ishga tushirish uchun yetarlicha kuchli hisoblanadi. Yashil rang esa deyarli yutilmay, aksincha qaytariladi — shuning uchun inson ko\'zi bargni yashil rangda idrok etadi. Bundan tashqari, o\'simliklarda xlorofill a va b bo\'lib ikki turi mavjudligi bu yutish diapazonini kengaytiradi, natijada o\'simlik quyosh energiyasidan kengroq spektrda foydalana oladi."}',
  },
  DEFINITION: {
    structure: '{ "kicker"?: string, "term": string (the term itself, ≤60 chars, unchanged from card mode — this stays the dominant visual element), "paragraph": string (280-650 chars: a FULLER explanatory paragraph than the card-mode `definition` field — define the term, then expand on its defining characteristics or why it matters, as connected prose rather than a short definition + separate aspect list) }',
    example: '{"term":"Konstitutsiyaviy huquq","paragraph":"Konstitutsiyaviy huquq — davlat tuzilishi asoslarini, inson va fuqaroning huquqiy maqomini hamda davlat hokimiyati organlari tizimini tartibga soluvchi huquqiy normalar majmuidan iborat milliy huquqning yetakchi tarmog\'idir. Bu tarmoq boshqa barcha huquq sohalari uchun huquqiy poydevor vazifasini bajaradi, chunki undagi normalar oliy yuridik kuchga ega va davlatning butun huquqiy tizimi aynan shu asosda quriladi. Shu sababli konstitutsiyaviy huquqni o\'rganish har qanday yuridik ta\'limning boshlang\'ich nuqtasi hisoblanadi."}',
  },
  BATAFSIL: {
    structure: '{ "kicker"?: string, "title": string (a full assertion headline, ≤80 chars), "paragraph": string (280-650 chars: a deeper-dive paragraph on this sub-topic — fold what would have been 2-4 side-column points into one connected explanation, in a logical order) }',
    example: '{"kicker":"Batafsil","title":"Kalvin sikli qandni stromada yig\'ib chiqaradi","paragraph":"Yorug\'lik reaksiyalaridan so\'ng RuBisCO fermenti uglerod dioksidini besh uglerodli molekulaga biriktiradi, bu esa siklning boshlang\'ich qadamidir. So\'ngra oldingi bosqichda hosil bo\'lgan ATP va NADPH energiyasi hisobidan bu uglerod qaytariladi va qayta tashkil etiladi, natijada glyukoza sintezlanadi. Shu bilan birga, boshlang\'ich molekula — RuBP — sikl davomida qayta tiklanadi, bu esa jarayonning uzluksiz davom etishini ta\'minlaydi."}',
  },
  MISOL: {
    structure: '{ "kicker"?: string, "title": string (assertion headline, ≤80 chars), "paragraph": string (280-650 chars: describe the concrete example as ONE flowing narrative — set the scene, then the mechanism/outcome, in natural order), "icon"?: string (ONE relevant icon name from AVAILABLE_ICONS), "takeaway"?: string (one line: what this example illustrates, max 140 chars) }',
    example: '{"title":"Bitta eman bargi — mini quyosh fabrikasi","paragraph":"Kattagina eman bargi o\'zida millionlab xloroplastlarni jamlaydi, bu esa unga kun davomida butun yuzasi bo\'ylab yorug\'likni tutib olish imkonini beradi. Bu jarayonda barg suvni parchalab, uglerodni shu qadar samarali biriktiradiki, bitta voyaga yetgan eman daraxti bir necha kishi uchun yetarli kislorod chiqaradi. Shu tarzda bitta bargdan butun o\'rmon miqyosiga o\'tilsa, fotosintezning global ta\'siri yaqqol namoyon bo\'ladi.","icon":"leaf","takeaway":"Bitta bargni o\'rmon miqyosiga ko\'paytiring — global ta\'sir shundan kelib chiqadi."}',
  },
  CONCLUSION: {
    structure: '{ "kicker"?: string, "title": string (e.g. "Xulosa"), "paragraph": string (280-650 chars: weave the 2-4 summary takeaways into ONE connected closing paragraph, in order of importance), "closing"?: string (one final sentence, max 160 chars) }',
    example: '{"title":"Xulosa","paragraph":"Fotosintez yorug\'lik energiyasini glyukozada saqlanadigan kimyoviy energiyaga aylantiradi, bu esa deyarli barcha hayot shakllari uchun asosiy energiya manbai hisoblanadi. Bundan tashqari, bu jarayon Yer yuzidagi kislorodning aksariyat qismini ham ishlab chiqaradi, natijada nafas olish uchun zarur muhitni ta\'minlaydi. Jarayon ikkita bog\'liq bosqichda — yorug\'lik reaksiyalari va Kalvin siklida — ketma-ket kechadi.","closing":"Fotosintezsiz hayotni saqlab turuvchi oziq zanjirlari mavjud bo\'lmas edi."}',
  },
};
