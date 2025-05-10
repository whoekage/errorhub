import api from './axios';

export async function getEnabledLanguages(): Promise<string[]> {
  const response = await api.get<{ enabledLanguages: string[] }>('/settings/languages/enabled');
  return response.data.enabledLanguages;
}

export async function enableLanguage(code: string): Promise<boolean> {
  const response = await api.post<{ success: boolean }>(`/settings/languages/${code}/enable`);
  return response.data.success;
}

export async function disableLanguage(code: string): Promise<boolean> {
  const response = await api.post<{ success: boolean }>(`/settings/languages/${code}/disable`);
  return response.data.success;
} 