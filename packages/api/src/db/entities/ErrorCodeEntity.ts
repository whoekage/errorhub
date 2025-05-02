import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ErrorTranslationEntity } from './ErrorTranslationEntity';
import { ErrorCategoryEntity } from './ErrorCategoryEntity';

@Entity('error_codes')
export class ErrorCodeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  code: string;

  @ManyToOne(() => ErrorCategoryEntity, category => category.errorCodes)
  @JoinColumn({ name: 'categoryId' })
  category: ErrorCategoryEntity;

  @Column()
  categoryId: number;

  @Column({ type: 'text' })
  defaultMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ErrorTranslationEntity, translation => translation.errorCode)
  translations: ErrorTranslationEntity[];
} 