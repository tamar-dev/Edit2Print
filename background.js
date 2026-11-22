importScripts('ui-locale.js');
const MENU_ID = 'print-selection';

function syncContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: uiText('printSelection'),
      contexts: ['selection', 'image']
    });
  });
}
chrome.runtime.onInstalled.addListener(syncContextMenu);
chrome.runtime.onStartup.addListener(syncContextMenu);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  try {
    // Prefer an active selection, even when the context menu was opened on an image.
    // Chrome reports mediaType=image in that case, but the user may have selected
    // text and images together.
    let payload = null;
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id, frameIds: [info.frameId ?? 0] },
        func: extractSelection
      });
      payload = results?.[0]?.result ?? null;
    } catch (selectionError) {
      // Some pages/frames disallow injection; a standalone image can still print.
      if (!(info.mediaType === 'image' && info.srcUrl)) throw selectionError;
    }
    if (!payload?.html && info.mediaType === 'image' && info.srcUrl) {
      payload = {
        kind: 'image',
        html: `<img class="single-image" src="${escapeAttribute(info.srcUrl)}" alt="" />`,
        title: 'Print image',
        direction: 'auto'
      };
    }
    if (!payload?.html) throw new Error(uiText('noSelection'));
    const id = crypto.randomUUID();
    await chrome.storage.local.set({ [`print_${id}`]: payload });
    await chrome.tabs.create({ url: chrome.runtime.getURL(`print.html?id=${encodeURIComponent(id)}`), active: true });
  } catch (error) {
    console.error('Print Selection:', error);
    await chrome.tabs.create({
      url: chrome.runtime.getURL(`error.html?message=${encodeURIComponent(error.message || 'Unknown error')}`)
    });
  }
});

function escapeAttribute(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// This function runs in the webpage, not the extension service worker.
function extractSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  const fragment = range.cloneContents();
  const wrapper = document.createElement('div');
  wrapper.appendChild(fragment);
  if (!wrapper.textContent?.trim() && !wrapper.querySelector('img,svg,canvas,table')) return null;

  // Keep images and links working when printed from an extension URL.
  for (const element of wrapper.querySelectorAll('[src], [href], [srcset]')) {
    for (const attr of ['src', 'href']) {
      const value = element.getAttribute(attr);
      if (value && !value.startsWith('data:') && !value.startsWith('blob:')) {
        try { element.setAttribute(attr, new URL(value, document.baseURI).href); } catch {}
      }
    }
    if (element.hasAttribute('srcset')) element.removeAttribute('srcset');
  }
  // Remove active content and unsafe embedded elements from copied markup.
  wrapper.querySelectorAll('script,iframe,object,embed,form,button,input,textarea,select,video,audio,link,meta,style').forEach(el => el.remove());
  for (const element of wrapper.querySelectorAll('*')) {
    for (const attr of [...element.attributes]) {
      if (attr.name.toLowerCase().startsWith('on')) element.removeAttribute(attr.name);
    }
  }
  return {
    kind: 'selection',
    html: wrapper.innerHTML,
    title: document.title || 'Print selection',
    direction: getComputedStyle(range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement).direction || 'auto'
  };
}
