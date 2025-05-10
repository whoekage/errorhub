import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEnabledLanguages,
  enableLanguage,
  disableLanguage,
} from '@/api/languageService';

export interface LanguageInfo {
  code: string;
  name: string;
  native: string;
  rtl: boolean;
}

const allLanguages: LanguageInfo[] = [
  { code: 'en', name: 'English', native: 'English', rtl: false },
  { code: 'ru', name: 'Russian', native: 'Русский', rtl: false },
  { code: 'kk', name: 'Kazakh', native: 'Қазақша', rtl: false },
  { code: 'ky', name: 'Kyrgyz', native: 'Кыргызча', rtl: false },
  { code: 'uz', name: 'Uzbek', native: "O'zbek", rtl: false },
  // Add more languages as needed
];

const LanguagesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const {
    data: enabledCodes = [],
    isLoading,
    isError,
    error,
  } = useQuery<string[], Error>({
    queryKey: ['enabledLanguages'],
    queryFn: getEnabledLanguages,
  });

  const enableMutation = useMutation({
    mutationFn: enableLanguage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enabledLanguages'] }),
  });

  const disableMutation = useMutation({
    mutationFn: disableLanguage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enabledLanguages'] }),
  });

  const filteredLanguages = useMemo(() => {
    return allLanguages
      .filter((lang: LanguageInfo) =>
        lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a: LanguageInfo, b: LanguageInfo) => a.name.localeCompare(b.name));
  }, [searchTerm]);

  const enabledLanguages = useMemo(() => {
    return allLanguages.filter((lang: LanguageInfo) => enabledCodes.includes(lang.code));
  }, [enabledCodes]);

  if (isLoading) return <div>Loading languages...</div>;
  if (isError) return <div>Error: {error?.message}</div>;

  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-3xl">
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
            <div className="flex flex-wrap gap-2 min-h-[28px]">
              {enabledLanguages.length > 0 ? (
                enabledLanguages.map((lang: LanguageInfo) => (
                  <Badge key={lang.code} variant="secondary">
                    {lang.name}
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
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map((lang: LanguageInfo) => {
                  const isEnabled = enabledCodes.includes(lang.code);
                  return (
                    <div key={lang.code} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50">
                      <Label htmlFor={`lang-switch-${lang.code}`} className="flex-1 cursor-pointer">
                        {lang.name} <span className="text-xs text-muted-foreground">({lang.code})</span>
                      </Label>
                      <Switch
                        id={`lang-switch-${lang.code}`}
                        checked={isEnabled}
                        onCheckedChange={(checked) =>
                          checked
                            ? enableMutation.mutate(lang.code)
                            : disableMutation.mutate(lang.code)
                        }
                        disabled={enableMutation.isPending || disableMutation.isPending}
                      />
                    </div>
                  );
                })
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