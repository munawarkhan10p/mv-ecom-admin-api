import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Vendor1 {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name?: string;

    @Column({ unique: true })
    email!: string;

    @Column({ nullable: true })
    shopName?: string;

    @Column({ nullable: true })
    shopAddress?: string;

    @Column({ nullable: true })
    shopNumber?: number;

    @Column({ nullable: true })
    hashedPassword?: string;

    @Column({name: 'is_active'})
    isActive: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
