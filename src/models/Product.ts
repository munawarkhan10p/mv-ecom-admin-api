import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { ProductStatus, Role } from './enums';

@Entity()
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: true })
    name?: string;

    @Column()
    categoryId: string;

    @Column()
    vendorId: string;

    @Column()
    price: string;

    @Column('enum', { enum: ProductStatus})
    status: ProductStatus

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
