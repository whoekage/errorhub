import { Entity, PrimaryColumn, CreateDateColumn, BaseEntity } from 'typeorm';

@Entity('enabled_languages')
export class EnabledLanguageEntity extends BaseEntity {
  @PrimaryColumn('varchar')
  code: string;

  @CreateDateColumn()
  enabledAt: Date;
} 