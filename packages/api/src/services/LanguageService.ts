import { DataSource, Repository } from 'typeorm';
import { EnabledLanguageEntity } from '@/db/entities/EnabledLanguageEntity';

export interface LanguageInfo {
  code: string;
  name: string;
  native: string;
  rtl: boolean;
  enabled: boolean;
}

export class LanguageService {
  private readonly AVAILABLE_LANGUAGES = {
    en: { name: 'English', native: 'English', rtl: false },
    ru: { name: 'Russian', native: 'Русский', rtl: false },
    kk: { name: 'Kazakh', native: 'Қазақша', rtl: false },
    ky: { name: 'Kyrgyz', native: 'Кыргызча', rtl: false },
    uz: { name: 'Uzbek', native: 'O\'zbek', rtl: false }
  };

  private repository: Repository<EnabledLanguageEntity>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(EnabledLanguageEntity);
  }

  async getEnabledLanguages(): Promise<string[]> {
    const results = await this.repository.find();
    return results.map(lang => lang.code);
  }

  async enableLanguage(code: string): Promise<boolean> {
    if (!Object.prototype.hasOwnProperty.call(this.AVAILABLE_LANGUAGES, code)) return false;
    
    const exists = await this.repository.findOne({ where: { code } });
    if (exists) return true; // Уже включен
    
    const entity = new EnabledLanguageEntity();
    entity.code = code;
    await this.repository.save(entity);
    return true;
  }

  async disableLanguage(code: string): Promise<boolean> {
    const result = await this.repository.delete({ code });
    return result.affected ? result.affected > 0 : false;
  }

  async getLanguagesWithStatus(): Promise<LanguageInfo[]> {
    const enabledLanguages = await this.getEnabledLanguages();
    const enabledSet = new Set(enabledLanguages);

    return Object.entries(this.AVAILABLE_LANGUAGES).map(([code, info]) => ({
      code,
      ...info,
      enabled: enabledSet.has(code)
    }));
  }
} 