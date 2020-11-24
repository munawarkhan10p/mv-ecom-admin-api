import moment from 'moment';
import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BaseModel } from './BaseModel';
import { Order } from './Orders';

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

    @OneToMany( () => Order, order => order.customer)
    order: Order;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}