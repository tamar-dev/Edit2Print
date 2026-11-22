const t = uiText;
document.documentElement.lang = chrome.i18n.getUILanguage();
document.documentElement.dir = /^he(?:-|$)|^ar(?:-|$)|^fa(?:-|$)|^ur(?:-|$)/i.test(chrome.i18n.getUILanguage()) ? 'rtl' : 'ltr';
document.getElementById('print-label').textContent = t('printButton');
const content = document.getElementById('content');
const status = document.getElementById('status');
document.getElementById('print').addEventListener('click', () => window.print());

(async () => {
  const id = new URLSearchParams(location.search).get('id');
  if (!id || !/^[a-f0-9-]{36}$/i.test(id)) throw new Error(t('invalidJob'));
  const key = `print_${id}`;
  const result = await chrome.storage.local.get(key);
  const payload = result[key];
  if (!payload) throw new Error(t('missingJob'));
  await chrome.storage.local.remove(key);
  document.title = t('printPageTitle');
  content.dir = payload.direction || 'auto';
  // Only allow passive print markup. Page HTML is untrusted, even after DOMParser.
  const parsed = new DOMParser().parseFromString(payload.html, 'text/html');
  const allowedTags = new Set(['DIV','SPAN','P','BR','B','STRONG','I','EM','U','S','SMALL','SUB','SUP','H1','H2','H3','H4','H5','H6','UL','OL','LI','BLOCKQUOTE','PRE','CODE','HR','TABLE','THEAD','TBODY','TFOOT','TR','TH','TD','CAPTION','A','IMG','SECTION','ARTICLE','HEADER','FOOTER','MAIN','FIGURE','FIGCAPTION','DL','DT','DD']);
  const allowedAttrs = new Set(['dir','lang','title','alt','colspan','rowspan']);
  function safeImageUrl(value) {
    try {
      const u = new URL(value);
      return ['https:', 'http:'].includes(u.protocol) || /^data:image\/(png|jpeg|gif|webp);base64,/i.test(value);
    } catch { return false; }
  }
  function safeLinkUrl(value) {
    try { return ['https:', 'http:'].includes(new URL(value).protocol); }
    catch { return false; }
  }
  function sanitize(parent) {
    for (const node of [...parent.childNodes]) {
      if (node.nodeType === Node.COMMENT_NODE) { node.remove(); continue; }
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (!allowedTags.has(node.tagName)) { node.remove(); continue; }
      for (const attr of [...node.attributes]) {
        const name = attr.name.toLowerCase();
        const value = attr.value;
        const keep = allowedAttrs.has(name) ||
          (node.tagName === 'IMG' && name === 'src' && safeImageUrl(value)) ||
          (node.tagName === 'A' && name === 'href' && safeLinkUrl(value));
        if (!keep) node.removeAttribute(attr.name);
      }
      sanitize(node);
    }
  }
  sanitize(parsed.body);
  while (parsed.body.firstChild) content.appendChild(document.importNode(parsed.body.removeChild(parsed.body.firstChild), true));
  // Allow images to load before the initial print dialog appears.
  await Promise.race([
    Promise.all([...content.querySelectorAll('img')].map(img => img.complete ? Promise.resolve() : new Promise(resolve => {
      img.addEventListener('load', resolve, { once:true });
      img.addEventListener('error', resolve, { once:true });
    }))),
    new Promise(resolve => setTimeout(resolve, 3500))
  ]);
  window.print();
})().catch(err => { status.textContent = `${t('printError')}: ${err.message}`; });
