import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { ProductStatus, Role, Status } from './enums';

@Entity()
export class Brand {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: true })
    name!: string;

    @Column()
    logoPath: string;

    @Column('enum', { enum: Status})
    status: Status

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
