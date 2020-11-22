import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { CategoryType } from "./enums";
import { Product } from "./Product";

@Entity()
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name: string;

    @Column('enum', {enum: CategoryType})
    type: CategoryType;

    @Column()
    description: string;

    @Column()
    commissionRate: number;

    @OneToMany(() => Product, product => product.category)
    product!: Product[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

}