import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, ManyToMany, OneToOne } from 'typeorm';

import { VendorSettings } from './VendorSettings';
import { VendorUser } from './VendorUser';
import { VendorType, VendorState } from './enums';

@Entity()
export class Vendor {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    name!: string;

    @Column('enum', { enum: VendorType, default: VendorType.INTERNAL })
    type!: VendorType;

    @Column('enum', { enum: VendorState, default: VendorState.NORMAL })
    state!: VendorState;

    @Column({ nullable: true })
    stripeCustomerId?: string;

    @OneToMany(() => VendorUser, vendorUsers => vendorUsers.vendor)
    vendorUsers!: VendorUser[];

    @OneToOne(() => VendorSettings, settings => settings.vendor)
    settings!: VendorSettings;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
