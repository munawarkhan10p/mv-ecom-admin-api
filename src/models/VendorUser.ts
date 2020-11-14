import { Column, CreateDateColumn, Entity, ManyToOne, UpdateDateColumn } from 'typeorm';

import { Vendor } from './Vendor';
import { VendorRole } from './enums';
import { User } from './User';

@Entity()
export class VendorUser {
    @Column({ primary: true })
    vendorId!: string;

    @Column({ primary: true })
    userId!: string;

    @Column('enum', { enum: VendorRole })
    role!: VendorRole;

    @Column({ default: false })
    invitationAccepted!: boolean;

    @ManyToOne(() => Vendor, vendor => vendor.vendorUsers, { onDelete: 'CASCADE' })
    vendor!: Vendor;

    @ManyToOne(() => User, user => user.vendorUsers)
    user!: User;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
