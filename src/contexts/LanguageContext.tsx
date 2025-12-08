import { createContext, useContext, useState, ReactNode } from "react";

type Language = "NL" | "FR" | "DE" | "EN";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translateText: (text: string, targetLang?: Language) => Promise<string>;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get language from localStorage or default to EN
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("preferredLanguage");
      return (saved as Language) || "EN";
    }
    return "EN";
  });

  const [isTranslating, setIsTranslating] = useState(false);

  // Save language preference to localStorage and trigger re-render
  const setLanguage = (lang: Language) => {
    console.log("setLanguage called with:", lang);
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredLanguage", lang);
      console.log("Saved to localStorage:", lang);
      // Dispatch custom event to notify all components
      const event = new CustomEvent("languageChanged", { detail: { language: lang } });
      window.dispatchEvent(event);
      console.log("Dispatched languageChanged event with:", lang);
    }
  };

  // Function to translate text using DeepL proxy
  const translateText = async (
    text: string,
    targetLang?: Language
  ): Promise<string> => {
    const targetLanguage = targetLang || language;

    // If already in target language or target is EN, return original
    if (targetLanguage === "EN") {
      return text;
    }

    try {
      setIsTranslating(true);

      const response = await fetch("/api/translate.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          target_lang: targetLanguage,
          source_lang: "EN",
        }),
      });

      if (!response.ok) {
        console.error("Translation failed:", response.statusText);
        return text; // Return original text if translation fails
      }

      const data = await response.json();

      // DeepL returns translations array
      if (data.translations && data.translations.length > 0) {
        return data.translations[0].text;
      }

      return text;
    } catch (error) {
      console.error("Translation error:", error);
      return text; // Return original text on error
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        translateText,
        isTranslating,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
