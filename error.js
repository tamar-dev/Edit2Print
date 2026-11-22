const t = uiText;
const lang = chrome.i18n.getUILanguage();
document.documentElement.lang = lang;
document.documentElement.dir = /^(he|ar|fa|ur)(-|$)/i.test(lang) ? 'rtl' : 'ltr';
document.title = t('errorTitle');
document.getElementById('heading').textContent = t('errorHeading');
document.getElementById('description').textContent = t('errorDescription');
