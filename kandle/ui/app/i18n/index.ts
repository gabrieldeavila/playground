import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import enHome from "./locales/en/home.json";
import ptBRCommon from "./locales/pt-BR/common.json";
import ptBRHome from "./locales/pt-BR/home.json";

export const supportedLanguages = ["pt-BR", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const storedLanguage =
  typeof window !== "undefined"
    ? window.localStorage.getItem("nexa-language")
    : null;

const initialLanguage: SupportedLanguage = supportedLanguages.includes(
  storedLanguage as SupportedLanguage,
)
  ? (storedLanguage as SupportedLanguage)
  : "pt-BR";

void i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": {
      common: ptBRCommon,
      home: ptBRHome,
    },
    en: {
      common: enCommon,
      home: enHome,
    },
  },
  lng: initialLanguage,
  fallbackLng: "pt-BR",
  supportedLngs: supportedLanguages,
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
});

export const changeLanguage = async (language: SupportedLanguage) => {
  await i18n.changeLanguage(language);

  if (typeof window !== "undefined") {
    window.localStorage.setItem("nexa-language", language);
    document.documentElement.lang = language;
  }
};

if (typeof document !== "undefined") {
  document.documentElement.lang = initialLanguage;
}

export default i18n;
