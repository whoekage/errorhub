import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ErrorCodeEntity } from './ErrorCodeEntity';

@Entity('error_categories')
export class ErrorCategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false, length: 255, type: 'varchar' })
  name: string;

  @Column({ nullable: true, length: 255, type: 'varchar' })
  description: string;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  @OneToMany(() => ErrorCodeEntity, errorCode => errorCode.category)
  errorCodes: ErrorCodeEntity[];
} 