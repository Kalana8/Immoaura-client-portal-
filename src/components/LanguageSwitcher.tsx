import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useState, useEffect } from "react";

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const [currentLang, setCurrentLang] = useState(language);

  useEffect(() => {
    console.log("Context language changed to:", language);
    setCurrentLang(language);
  }, [language]);

  useEffect(() => {
    const handleLangChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.language) {
        console.log("Custom event in sidebar:", customEvent.detail.language);
        setCurrentLang(customEvent.detail.language);
      }
    };

    window.addEventListener("languageChanged", handleLangChange);
    return () => window.removeEventListener("languageChanged", handleLangChange);
  }, []);

  const languages = [
    { code: "NL" as const, name: "Nederlands", flag: "🇳🇱" },
    { code: "FR" as const, name: "Français", flag: "🇫🇷" },
    { code: "DE" as const, name: "Deutsch", flag: "🇩🇪" },
    { code: "EN" as const, name: "English", flag: "🇬🇧" },
  ];

  const selectLanguage = (lang: "NL" | "FR" | "DE" | "EN") => {
    console.log("Sidebar: Selecting language", lang);
    setCurrentLang(lang);
    setLanguage(lang);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap w-full">
      <div className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
        <Globe className="h-4 w-4" />
        <span className="font-medium">Language:</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {languages.map((lang) => (
          <Button
            key={lang.code}
            onClick={() => selectLanguage(lang.code)}
            variant={currentLang === lang.code ? "default" : "outline"}
            size="sm"
            className={`
              transition-all duration-200
              ${
                currentLang === lang.code
                  ? "bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
              }
            `}
          >
            <span className="mr-1">{lang.flag}</span>
            <span className="hidden sm:inline">{lang.name}</span>
            <span className="sm:hidden">{lang.code}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
