function esc(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch] ?? ch));
}

export function imageLabHtml(token: string): string {
  return `<!doctype html>
<html lang="uz">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Lumio Image Lab</title>
  <style>
    :root { color-scheme: dark; --bg:#0c0f14; --panel:#151a22; --line:#29313d; --text:#edf2f7; --muted:#96a3b2; --accent:#75d7b8; --bad:#ff8d8d; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; background:var(--bg); color:var(--text); }
    main { max-width:1180px; margin:0 auto; padding:28px; }
    h1 { margin:0 0 18px; font-size:28px; letter-spacing:0; }
    .grid { display:grid; grid-template-columns: 390px 1fr; gap:18px; align-items:start; }
    .panel { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:16px; }
    label { display:block; font-size:13px; color:var(--muted); margin:12px 0 6px; }
    input, select, textarea, button { width:100%; border:1px solid var(--line); border-radius:6px; background:#0f141b; color:var(--text); padding:10px 11px; font:inherit; }
    textarea { min-height:150px; resize:vertical; line-height:1.45; }
    button { margin-top:14px; background:var(--accent); color:#07110e; border:0; font-weight:700; cursor:pointer; }
    button:disabled { opacity:.55; cursor:not-allowed; }
    .row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .hint, .meta { color:var(--muted); font-size:13px; line-height:1.45; }
    .meta { margin-top:10px; white-space:pre-wrap; }
    .error { color:var(--bad); }
    .images { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:12px; }
    .image-card { border:1px solid var(--line); border-radius:8px; overflow:hidden; background:#090d12; }
    .image-card img { display:block; width:100%; height:auto; }
    .image-card a { display:block; padding:9px 10px; color:var(--accent); font-size:13px; text-decoration:none; }
    @media (max-width: 860px) { main { padding:16px; } .grid { grid-template-columns:1fr; } }
  </style>
</head>
<body>
<main>
  <h1>Lumio Image Lab</h1>
  <div class="grid">
    <section class="panel">
      <div class="hint">OpenRouter Image API orqali model test. Natijada rasm va qaytgan cost ko‘rinadi.</div>
      <label>Model</label>
      <select id="model"></select>
      <input id="customModel" placeholder="Yoki model slug yozing: openai/gpt-image-1" />
      <label>Prompt</label>
      <textarea id="prompt">Clean modern geometric educational illustration for a university presentation slide about photosynthesis, abstract leaf shapes, sunlight beams, carbon cycle hints, premium dark background, no text, no letters, 16:9 composition</textarea>
      <div class="row">
        <div><label>Aspect</label><select id="aspect"><option>16:9</option><option>1:1</option><option>4:3</option><option>3:2</option><option>9:16</option></select></div>
        <div><label>Resolution</label><select id="resolution"><option>1K</option><option>512</option><option>2K</option><option></option></select></div>
      </div>
      <div class="row">
        <div><label>Quality</label><select id="quality"><option>auto</option><option>low</option><option>medium</option><option>high</option><option></option></select></div>
        <div><label>Format</label><select id="format"><option>png</option><option>jpeg</option><option>webp</option></select></div>
      </div>
      <div class="row">
        <div><label>Provider sort</label><select id="sort"><option value="price">price</option><option value="latency">latency</option><option value="throughput">throughput</option><option value="">none</option></select></div>
        <div><label>N</label><input id="n" type="number" min="1" max="4" value="1" /></div>
      </div>
      <label>Provider only (optional)</label>
      <input id="providerOnly" placeholder="Masalan: google-ai-studio" />
      <button id="run">Generate</button>
      <div id="status" class="meta"></div>
    </section>
    <section class="panel">
      <div id="meta" class="meta">Model list yuklanmoqda...</div>
      <div id="images" class="images"></div>
    </section>
  </div>
</main>
<script>
const token = ${JSON.stringify(token)};
const recommended = [
  'openai/gpt-image-1-mini',
  'openai/gpt-image-1',
  'openai/gpt-image-2',
  'google/gemini-3.1-flash-lite-image',
  'google/gemini-3.1-flash-image',
  'google/gemini-2.5-flash-image',
  'black-forest-labs/flux.2-pro',
  'bytedance-seed/seedream-4.5'
];
const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const res = await fetch('/image-lab' + path + '?token=' + encodeURIComponent(token), {
    ...options,
    headers: { 'Content-Type': 'application/json', 'x-image-lab-token': token, ...(options.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      throw new Error(parsed.message || text);
    } catch (e) {
      if (e instanceof Error && e.message !== text) throw e;
      throw new Error(text);
    }
  }
  return res.json();
}

function setStatus(text, isError=false) {
  $('status').className = 'meta' + (isError ? ' error' : '');
  $('status').textContent = text;
}

function option(value, label = value) {
  const o = document.createElement('option');
  o.value = value;
  o.textContent = label;
  return o;
}

async function loadModels() {
  const select = $('model');
  recommended.forEach((m) => select.appendChild(option(m)));
  try {
    const data = await api('/api/models');
    const ids = new Set([...recommended]);
    for (const m of data.data || []) {
      if (!ids.has(m.id)) {
        select.appendChild(option(m.id, m.name ? m.id + ' - ' + m.name : m.id));
        ids.add(m.id);
      }
    }
    $('meta').textContent = 'Models loaded: ' + ids.size + '. Pricing/capabilities are checked by OpenRouter per endpoint.';
  } catch (e) {
    $('meta').textContent = 'Model list yuklanmadi, lekin custom model bilan test qilish mumkin. ' + e.message;
  }
}

function dataUrl(item) {
  const media = item.media_type || 'image/png';
  return 'data:' + media + ';base64,' + item.b64_json;
}

$('run').addEventListener('click', async () => {
  $('run').disabled = true;
  $('images').innerHTML = '';
  setStatus('Generating...');
  try {
    const body = {
      model: $('customModel').value.trim() || $('model').value,
      prompt: $('prompt').value,
      n: Number($('n').value || 1),
      aspect_ratio: $('aspect').value,
      resolution: $('resolution').value,
      quality: $('quality').value,
      output_format: $('format').value,
      provider_sort: $('sort').value,
      provider_only: $('providerOnly').value.trim(),
    };
    const started = performance.now();
    const result = await api('/api/generate', { method: 'POST', body: JSON.stringify(body) });
    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    const usage = result.usage || {};
    $('meta').textContent = JSON.stringify({ model: body.model, seconds, usage }, null, 2);
    for (const [i, item] of (result.data || []).entries()) {
      const url = dataUrl(item);
      const card = document.createElement('div');
      card.className = 'image-card';
      card.innerHTML = '<img src="' + url + '" alt="generated image ' + (i + 1) + '"><a download="image-lab-' + (i + 1) + '.png" href="' + url + '">Open / download</a>';
      $('images').appendChild(card);
    }
    setStatus('Done. Cost: ' + (usage.cost !== undefined ? '$' + usage.cost : 'unknown'));
  } catch (e) {
    setStatus(e.message, true);
  } finally {
    $('run').disabled = false;
  }
});

loadModels();
</script>
</body>
</html>`;
}
