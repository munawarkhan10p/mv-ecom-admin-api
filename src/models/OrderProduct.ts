import { Column, Entity, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany} from 'typeorm';
import {PrimaryGeneratedColumn} from 'typeorm/index';
import {Order} from './Orders';
import {Product} from './Product';

@Entity()
export class OrderProduct {

    @PrimaryGeneratedColumn()
    orderProductId: number;

    @Column()
    productId: number;

    @Column()
    orderId: number;

    @Column({name: 'quantity'})
    quantity: number;

    @Column()
    productPrice: number;

    @Column()
    total: number;

    @OneToMany(type => Product, product => product.orderProduct)
    product: Product[];

    @OneToOne(type => Order, order => order.orderProduct)
    order: Order;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
