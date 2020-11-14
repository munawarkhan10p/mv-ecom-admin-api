import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { AccountRequestStatus } from './enums';

@Entity()
export class AccountRequest {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column()
    email!: string;

    @Column()
    company!: string;

    @Column('text')
    description!: string;

    @Column('enum', { enum: AccountRequestStatus, default: AccountRequestStatus.UNDECIDED })
    status!: AccountRequestStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
