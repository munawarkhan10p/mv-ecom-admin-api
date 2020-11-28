import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Category } from './Category';

import { ProductStatus, Role } from './enums';
import { OrderProduct } from './OrderProduct';
import { Order } from './Orders';
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

    @ManyToOne(() => Category, category => category.product)
    @JoinColumn()
    category: Category;

    @ManyToOne(() => Vendor, vendor => vendor.product)
    @JoinColumn()
    vendor: Vendor;

    @ManyToOne(() => Order, order => order.product)
    order: Order;

    @OneToMany(type => OrderProduct, orderProduct => orderProduct.product)
    orderProduct: OrderProduct[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
