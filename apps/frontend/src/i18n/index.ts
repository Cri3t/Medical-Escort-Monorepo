import { createI18n } from "vue-i18n";
import en from "./locales/en";
import zhCN from "./locales/zh-CN";

export type SupportedLocale = "en" | "zh-CN";

export const DEFAULT_LOCALE: SupportedLocale = "en";
export const LOCALE_STORAGE_KEY = "medical-escort-locale";

export const messages = {
  en,
  "zh-CN": zhCN,
};

export function isSupportedLocale(value: string | null): value is SupportedLocale {
  return value === "en" || value === "zh-CN";
}

export function getInitialLocale(): SupportedLocale {
  const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);

  if (isSupportedLocale(storedLocale)) {
    return storedLocale;
  }

  return DEFAULT_LOCALE;
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages,
});

function getGlobalComposer() {
  return i18n.global as unknown as {
    locale: { value: SupportedLocale };
    t: (key: string, params?: Record<string, string | number>) => string;
  };
}

export function setLocale(locale: SupportedLocale) {
  getGlobalComposer().locale.value = locale;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}

export function translate(
  key: string,
  params?: Record<string, string | number>,
) {
  return getGlobalComposer().t(key, params);
}

setLocale(getInitialLocale());
