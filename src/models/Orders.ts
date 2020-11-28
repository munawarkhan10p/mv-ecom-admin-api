import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Customer } from "./Customer";
import { OrderStatus } from "./enums";
import { OrderProduct } from "./OrderProduct";
import { Product } from "./Product";



@Entity()
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    orderCode: string;

    @Column()
    amount: number;

    @Column('enum', { enum: OrderStatus })
    status: OrderStatus

    @Column()
    customerId: string;

    @Column()
    productId: string;

    @ManyToOne( () => Customer, customer => customer.order)
    customer: Customer;

    @OneToMany( () => Product, product => product.order)
    product: Product[];

    @OneToOne(type => OrderProduct, orderProduct => orderProduct.order)
    orderProduct: OrderProduct;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

}