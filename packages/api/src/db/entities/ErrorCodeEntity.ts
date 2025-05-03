import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ErrorTranslationEntity } from './ErrorTranslationEntity';
import { ErrorCategoryEntity } from './ErrorCategoryEntity';

@Entity('error_codes')
export class ErrorCodeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false, length: 255, type: 'varchar' })
  @Index()
  code: string;

  @ManyToOne(() => ErrorCategoryEntity, category => category.errorCodes, { nullable: true })
  @JoinColumn({ name: 'categoryId', referencedColumnName: 'id' })
  category: ErrorCategoryEntity | null;

  @Column({ nullable: true, type: 'int' })
  categoryId: number | null;

  @Column({ type: 'text', nullable: false })
  defaultMessage: string;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  @OneToMany(() => ErrorTranslationEntity, translation => translation.errorCode)
  translations: ErrorTranslationEntity[];
} 