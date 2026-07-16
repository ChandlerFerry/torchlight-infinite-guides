import { enData, koData, jaData, ruData } from "./translations.js";
import { uiTranslationsMap } from "./ui-translations.js";

declare const TARGET_LANG: 'en' | 'ko' | 'ja' | 'ru';

const langDataMap = { en: enData, ko: koData, ja: jaData, ru: ruData };
const databaseData = langDataMap[TARGET_LANG];
const uiTranslations = uiTranslationsMap[TARGET_LANG];

const allTranslations = { ...databaseData, ...uiTranslations };
const sortedTranslations = Object.entries(allTranslations)
  .sort((a, b) => b[0].length - a[0].length)
  .map(([chinese, translated]) => ({
    pattern: new RegExp(chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
    translated
  }));

const translatedNodes = new WeakSet<Node>();
const hiddenElements = new WeakSet<Element>();

function hideUnwantedElements(root: Element | Document): void {
  const elements = root.querySelectorAll('.text-sm.font-medium.text-slate-700');
  for (const el of elements) {
    if (el.textContent?.includes('火价折算')) {
      const container = el.closest('.flex.items-center.justify-between');
      if (container && !hiddenElements.has(container)) {
        (container as HTMLElement).style.display = 'none';
        hiddenElements.add(container);
      }
    }
  }

  // Sigh
  for (const btn of root.querySelectorAll('button')) {
    if (btn.textContent?.includes('FE Price Chart') && !hiddenElements.has(btn)) {
      (btn as HTMLElement).style.display = 'none';
      hiddenElements.add(btn);
    }
  }

  const langSwitchers = root.querySelectorAll('.language-switcher');
  for (const el of langSwitchers) {
    const container = el.closest('.px-1');
    const target = container ?? el;
    if (!hiddenElements.has(target)) {
      (target as HTMLElement).style.display = 'none';
      hiddenElements.add(target);
    }
  }

  const modalHeaders = root.querySelectorAll('.modal-header');
  for (const header of modalHeaders) {
    const title = header.querySelector('h2');
    if (title?.textContent?.includes('Confirm Data Reset')) {
      const closeBtn = header.querySelector('button[aria-label="关闭"]');
      if (closeBtn && !hiddenElements.has(closeBtn)) {
        (closeBtn as HTMLElement).style.display = 'none';
        hiddenElements.add(closeBtn);
      }
    }
  }
}

function translateText(text: string): string {
  let result = text;
  for (const { pattern, translated } of sortedTranslations) {
    result = result.replace(pattern, translated);
  }

  // Postfix to protect tool's name
  result = result.replace(/易🔥/g, '易火');

  return result;
}

function translateElement(element: Element): void {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (translatedNodes.has(node)) continue;

    const original = node.textContent;
    if (original) {
      const translated = translateText(original);
      if (original !== translated) {
        node.textContent = translated;
        translatedNodes.add(node);
      }
    }
  }

  element.querySelectorAll('[title]').forEach(el => {
    const original = (el as HTMLElement).title;
    const translated = translateText(original);
    if (original !== translated) {
      (el as HTMLElement).title = translated;
    }
  });

  element.querySelectorAll('[placeholder]').forEach(el => {
    const original = (el as HTMLInputElement).placeholder;
    const translated = translateText(original);
    if (original !== translated) {
      (el as HTMLInputElement).placeholder = translated;
    }
  });
}

let pendingNodes = new Set<Node>();
let rafId: number | null = null;

function queueTranslation(node: Node): void {
  pendingNodes.add(node);
  if (!rafId) {
    rafId = requestAnimationFrame(processPendingTranslations);
  }
}

function processPendingTranslations(): void {
  rafId = null;
  const nodes = pendingNodes;
  pendingNodes = new Set();

  for (const node of nodes) {
    if (!document.contains(node)) continue;

    if (node.nodeType === Node.ELEMENT_NODE) {
      hideUnwantedElements(node as Element);
      translateElement(node as Element);
    } else if (node.nodeType === Node.TEXT_NODE) {
      if (translatedNodes.has(node)) continue;

      const original = node.textContent;
      if (original) {
        const translated = translateText(original);
        if (original !== translated) {
          node.textContent = translated;
          translatedNodes.add(node);
        }
      }
    }
  }
}

const trySetLocale = setInterval(() => {
  const app = (document.querySelector('#app') as any)?.__vue_app__;
  if (app) {
    clearInterval(trySetLocale);
    const i18n = app.config.globalProperties.$i18n;
    if (i18n && i18n.locale !== 'en-US') i18n.locale = 'en-US';
  }
}, 100);

hideUnwantedElements(document);
translateElement(document.body);

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      queueTranslation(node);
    }
    if (mutation.type === 'characterData') {
      const text = mutation.target.textContent || '';
      const textWithoutToolName = text.replace(/易火/g, '');
      if (/[\u4e00-\u9fff]/.test(textWithoutToolName)) {
        translatedNodes.delete(mutation.target);
        queueTranslation(mutation.target);
      }
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});

const portalModalObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (el.id === 'headlessui-portal-root') {
          observer.observe(el, {
            childList: true,
            subtree: true,
            characterData: true
          });
          portalModalObserver.disconnect();
          break;
        }
      }
    }
  }
});

const existingPortalModal = document.querySelector('#headlessui-portal-root');
if (existingPortalModal) {
  observer.observe(existingPortalModal, {
    childList: true,
    subtree: true,
    characterData: true
  });
} else {
  portalModalObserver.observe(document.body, {
    childList: true,
    subtree: false
  });
}
