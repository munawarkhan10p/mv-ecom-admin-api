import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { CategoryType } from "./enums";

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

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

}