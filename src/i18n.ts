import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import he from "./locales/he.json";
import ru from "./locales/ru.json";

export type AppLanguage = "en" | "he" | "ru";

const LANG_KEY = "agamiz:language";
const SUPPORTED: AppLanguage[] = ["en", "he", "ru"];

const DIRS: Record<AppLanguage, "ltr" | "rtl"> = {
  en: "ltr",
  he: "rtl",
  ru: "ltr",
};

function isSupported(value: string | null): value is AppLanguage {
  return value !== null && (SUPPORTED as string[]).includes(value);
}

export function tmdbLanguageFor(lang: string): string {
  switch (lang.toLowerCase().slice(0, 2)) {
    case "he":
      return "he-IL";
    case "ru":
      return "ru-RU";
    default:
      return "en-US";
  }
}

export function getInitialLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (isSupported(stored)) return stored;
  } catch {
  }
  try {
    const nav = (navigator.language ?? "en").split("-")[0].toLowerCase();
    if (isSupported(nav)) return nav as AppLanguage;
  } catch {
  }
  return "en";
}

export function applyDocumentLanguage(lang: AppLanguage) {
  const doc = document.documentElement;
  if (!doc) return;
  doc.lang = lang;
  doc.dir = DIRS[lang];
}

export function isRTL(lang: string): boolean {
  return DIRS[lang as AppLanguage] === "rtl";
}

export async function changeLanguage(lang: AppLanguage): Promise<void> {
  if (!isSupported(lang)) return;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
  }
  applyDocumentLanguage(lang);
  await i18n.changeLanguage(lang);
}

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
      ru: { translation: ru },
    },
    lng: getInitialLanguage(),
    fallbackLng: "en",
    supportedLngs: SUPPORTED,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

applyDocumentLanguage(i18n.language as AppLanguage);

export default i18n;
