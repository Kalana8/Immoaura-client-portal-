import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  const [showSelector, setShowSelector] = useState(false);
  const [selectedLang, setSelectedLang] = useState<"NL" | "FR" | "DE" | "EN">(language);

  // Check if user has previously selected a language
  useEffect(() => {
    const hasSelectedLanguage = localStorage.getItem("languageSelected");
    if (!hasSelectedLanguage) {
      setShowSelector(true);
    } else {
      setShowSelector(false);
    }
  }, []);

  // Update selectedLang when language context changes
  useEffect(() => {
    setSelectedLang(language);
  }, [language]);

  const languages = [
    {
      code: "NL" as const,
      name: "Nederlands",
      flag: "🇳🇱",
      description: "Dutch",
    },
    {
      code: "FR" as const,
      name: "Français",
      flag: "🇫🇷",
      description: "French",
    },
    {
      code: "DE" as const,
      name: "Deutsch",
      flag: "🇩🇪",
      description: "German",
    },
    {
      code: "EN" as const,
      name: "English",
      flag: "🇬🇧",
      description: "English",
    },
  ];

  const handleLanguageSelect = (lang: "NL" | "FR" | "DE" | "EN") => {
    console.log("Language selected:", lang);
    setSelectedLang(lang);
    setLanguage(lang);
    localStorage.setItem("languageSelected", "true");
    
    // Close modal after short delay to show selection feedback
    setTimeout(() => {
      setShowSelector(false);
    }, 300);
  };

  if (!showSelector) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <Card className="w-full max-w-2xl border-0 shadow-2xl animate-slideUp">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center justify-center gap-3">
            <Globe className="h-6 w-6" />
            <div className="text-center">
              <CardTitle className="text-2xl font-bold">Select Your Language</CardTitle>
              <CardDescription className="text-blue-100 mt-1">
                Choose your preferred language to continue browsing
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-8 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 cursor-pointer transform hover:scale-105 ${
                  selectedLang === lang.code
                    ? "border-blue-600 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                }`}
              >
                <span className="text-4xl">{lang.flag}</span>
                <span className="font-semibold text-gray-900 text-sm">
                  {lang.name}
                </span>
                <span className="text-xs text-gray-600">{lang.description}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              onClick={() => handleLanguageSelect(selectedLang)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 h-auto text-base transition-all duration-200"
            >
              ✓ Continue with {languages.find((l) => l.code === selectedLang)?.name}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            You can change your language preference anytime from the sidebar
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
