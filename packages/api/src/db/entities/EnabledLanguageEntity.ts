import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('enabled_languages')
export class EnabledLanguageEntity {
  @PrimaryColumn()
  code: string;

  @CreateDateColumn()
  enabledAt: Date;
} 