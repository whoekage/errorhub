import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn, Unique } from 'typeorm';
import { ErrorCodeEntity } from './ErrorCodeEntity';

@Entity('error_translations')
@Unique(['errorCode', 'language'])
export class ErrorTranslationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  language: string;

  @Column({ type: 'text' })
  message: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => ErrorCodeEntity, errorCode => errorCode.translations, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'errorCode', referencedColumnName: 'code' })
  errorCode: ErrorCodeEntity;
} 