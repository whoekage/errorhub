import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge'; // For displaying selected languages

// Initial active languages - this can be fetched or configured in a real app
const initialActiveI18nCodes: LanguageCode[] = ['kk', 'ky', 'uz', 'ru', 'en']; // used ky instead of kg for consistency

// A more comprehensive list of available languages (code: name)
// Source: Simplified from common language lists
const allAvailableLanguages: Record<string, string> = {
  en: 'English',
  es: 'Español (Spanish)',
  fr: 'Français (French)',
  de: 'Deutsch (German)',
  it: 'Italiano (Italian)',
  pt: 'Português (Portuguese)',
  ru: 'Русский (Russian)',
  ja: '日本語 (Japanese)',
  ko: '한국어 (Korean)',
  zh: '中文 (Chinese)',
  ar: 'العربية (Arabic)',
  hi: 'हिन्दी (Hindi)',
  tr: 'Türkçe (Turkish)',
  nl: 'Nederlands (Dutch)',
  sv: 'Svenska (Swedish)',
  pl: 'Polski (Polish)',
  cs: 'Čeština (Czech)',
  el: 'Ελληνικά (Greek)',
  he: 'עברית (Hebrew)',
  th: 'ไทย (Thai)',
  vi: 'Tiếng Việt (Vietnamese)',
  id: 'Bahasa Indonesia (Indonesian)',
  ms: 'Bahasa Melayu (Malay)',
  ro: 'Română (Romanian)',
  hu: 'Magyar (Hungarian)',
  fi: 'Suomi (Finnish)',
  da: 'Dansk (Danish)',
  no: 'Norsk (Norwegian)',
  kk: 'Қазақ тілі (Kazakh)',
  uz: 'Oʻzbek tili (Uzbek)',
  ky: 'Кыргызча (Kyrgyz)',
  uk: 'Українська (Ukrainian)',
  bg: 'Български (Bulgarian)',
  hr: 'Hrvatski (Croatian)',
  sr: 'Српски (Serbian)',
  sk: 'Slovenčina (Slovak)',
  sl: 'Slovenščina (Slovenian)',
  et: 'Eesti (Estonian)',
  lv: 'Latviešu (Latvian)',
  lt: 'Lietuvių (Lithuanian)',
  fa: 'فارسی (Persian)',
};

type LanguageCode = keyof typeof allAvailableLanguages;

const LanguagesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [enabledLanguages, setEnabledLanguages] = useState<Set<LanguageCode>>(
    new Set(initialActiveI18nCodes)
  );

  const handleSwitchChange = (languageCode: LanguageCode, checked: boolean) => {
    setEnabledLanguages(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(languageCode);
      } else {
        newSet.delete(languageCode);
      }
      console.log(`Language ${languageCode} ${checked ? 'enabled' : 'disabled'}`);
      return newSet;
    });
  };

  const filteredAvailableLanguages = useMemo(() => {
    return Object.entries(allAvailableLanguages)
      .filter(([code, name]) => 
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort(([_, nameA], [__, nameB]) => nameA.localeCompare(nameB));
  }, [searchTerm]);

  // Derive the list of active languages for the first card from the enabledLanguages state
  const activeLanguagesForDisplay = useMemo(() => {
    return Array.from(enabledLanguages).map(code => ({
        code,
        name: allAvailableLanguages[code] || code.toUpperCase()
    })).sort((a,b) => a.name.localeCompare(b.name)); // Sort for consistent display
  }, [enabledLanguages]);

  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-3xl"> {/* Single column, constrained width */}
      <h1 className="text-3xl font-bold mb-6">Language Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Active i18n Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              These languages are currently enabled for internationalization across the platform.
            </p>
            <div className="flex flex-wrap gap-2 min-h-[28px]"> {/* Added min-height */}
              {activeLanguagesForDisplay.length > 0 ? (
                activeLanguagesForDisplay.map(({ code, name }) => (
                  <Badge key={code} variant="secondary">
                    {name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground italic">No languages selected.</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Enable or disable languages for your application. Changes here might affect available translations.
            </p>
            <Input
              type="search"
              placeholder="Search languages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2"> {/* Scrollable list */}
              {filteredAvailableLanguages.length > 0 ? (
                filteredAvailableLanguages.map(([code, name]) => (
                  <div key={code} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50">
                    <Label htmlFor={`lang-switch-${code}`} className="flex-1 cursor-pointer">
                      {name} <span className="text-xs text-muted-foreground">({code})</span>
                    </Label>
                    <Switch
                      id={`lang-switch-${code}`}
                      checked={enabledLanguages.has(code as LanguageCode)}
                      onCheckedChange={(checked) => handleSwitchChange(code as LanguageCode, checked)}
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No languages found matching your search.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LanguagesPage; 