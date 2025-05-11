import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index, ManyToMany, JoinTable } from 'typeorm';
import { ErrorTranslationEntity } from './ErrorTranslationEntity';
import { ErrorCategoryEntity } from './ErrorCategoryEntity';

export enum ErrorCodeStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Index(['code'], { unique: true })
@Entity('error_codes')
export class ErrorCodeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  code!: string;

  @ManyToMany(() => ErrorCategoryEntity, (category) => category.errorCodes)
  @JoinTable({
    name: 'error_code_categories',
    joinColumn: {
        name: 'error_code_id',
        referencedColumnName: 'id'
    },
    inverseJoinColumn: {
        name: 'category_id',
        referencedColumnName: 'id'
    }
  })
  categories!: ErrorCategoryEntity[];

  @OneToMany(() => ErrorTranslationEntity, (translation) => translation.errorCode, {
    cascade: true,
  })
  translations!: ErrorTranslationEntity[];

  @Column({
    type: 'varchar',
    length: 50,
    default: ErrorCodeStatus.DRAFT,
  })
  status!: ErrorCodeStatus;

  @Column({ type: 'text', nullable: true })
  context?: string | null;

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
} 