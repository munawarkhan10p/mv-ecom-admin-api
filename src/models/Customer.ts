import moment from 'moment';
import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BaseModel } from './BaseModel';

@Entity()
export class Customer {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: true })
    firstName: string;

    @Column({ nullable: true })
    lastName: string;

    @Column({ nullable: true })
    hashedPassword: string;

    @Column({ unique: true })
    email: string;

    @Column()
    isActive: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}