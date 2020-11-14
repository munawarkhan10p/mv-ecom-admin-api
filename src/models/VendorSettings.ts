import { Column, Entity, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';

import { Vendor } from './Vendor';

@Entity()
export class VendorSettings {
    @OneToOne(() => Vendor, vendor => vendor.settings, { primary: true, onDelete: 'CASCADE' })
    @JoinColumn()
    vendor!: Vendor;

    @Column()
    userLimit!: number;

    @Column()
    productLimit!: number;

    @UpdateDateColumn()
    updatedAt!: Date;
}
