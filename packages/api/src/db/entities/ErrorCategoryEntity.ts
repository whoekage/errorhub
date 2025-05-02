import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ErrorCodeEntity } from './ErrorCodeEntity';

@Entity('error_categories')
export class ErrorCategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ErrorCodeEntity, errorCode => errorCode.category)
  errorCodes: ErrorCodeEntity[];
} 