const t = uiText;
const lang = chrome.i18n.getUILanguage();
document.documentElement.lang = /^he(?:-|$)/i.test(lang) ? 'he' : 'en';
document.documentElement.dir = /^he(?:-|$)/i.test(lang) ? 'rtl' : 'ltr';
document.title = t('errorTitle');
document.getElementById('heading').textContent = t('errorHeading');
document.getElementById('description').textContent = t('errorDescription');
