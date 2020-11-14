import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { VendorUser } from './VendorUser';
import { Role } from './enums';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ nullable: true })
    firstName?: string;

    @Column({ nullable: true })
    lastName?: string;

    @Column('enum', { enum: Role })
    role!: Role;

    @Column({ nullable: true })
    hashedPassword?: string;

    @Column({ default: false })
    invitationAccepted!: boolean;

    @OneToMany(() => VendorUser, vendorUsers => vendorUsers.user)
    vendorUsers!: VendorUser[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
