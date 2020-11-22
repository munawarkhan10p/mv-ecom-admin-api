import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Category } from './Category';

import { ProductStatus, Role } from './enums';
import { Vendor } from './Vendor';

@Entity()
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    price: number;

    @Column('enum', { enum: ProductStatus})
    status: ProductStatus;

    @Column({
        type: 'jsonb',
        array: false,
        nullable: false,
    })
    imagesPath: string[];

    @Column()
    categoryId: string;

    @Column()
    vendorId: string;

    @ManyToOne(() => Category, category => category.product)
    category: Category;

    @ManyToOne(() => Vendor, vendor => vendor.product)
    vendor: Vendor;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
