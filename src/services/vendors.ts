import Boom from '@hapi/boom';

import { Vendor } from '../models/Vendor';
import { VendorSettings } from '../models/VendorSettings';
import { VendorType, VendorState } from '../models/enums';
import VendorRepo from '../repositories/vendors';
import VendorSettingsRepo from '../repositories/vendorSettings';

export async function getAllVendors(offset: number, limit: number): Promise<[Vendor[], number]> {
    return VendorRepo.getAll(offset, limit);
}

export async function getAllUserVendors(userId: string, invitationAccepted: boolean | 'all', offset: number, limit: number): Promise<[Vendor[], number]> {
    return VendorRepo.getAllByUserId(userId, invitationAccepted, offset, limit);
}

export async function findVendor(vendorId: string): Promise<Vendor> {
    const vendor = await VendorRepo.find(vendorId);
    if (!vendor) {
        throw Boom.notFound('Vendor with this id does not exist');
    }

    return vendor;
}

export async function findVendorByStripeCustomerId(stripeCustomerId: string): Promise<Vendor> {
    const vendor = await VendorRepo.findByStripeCustomerId(stripeCustomerId);
    if (!vendor) {
        throw Boom.notFound('Vendor with this id does not exist');
    }

    return vendor;
}

export async function createVendor(name: string, type: VendorType, settings: Pick<VendorSettings, 'userLimit' | 'productLimit'>): Promise<Vendor> {
    const vendor = await VendorRepo.findByName(name);
    if (vendor) {
        throw Boom.conflict('Vendor with this name already exist');
    }

    const _vendor = await VendorRepo.create(name, type, VendorState.NORMAL);

    const _settings = await VendorSettingsRepo.update(_vendor.id, settings);

    _vendor.settings = _settings;

    return _vendor;
}

export async function updateVendor(vendorId: string, name: string, settings: Pick<VendorSettings, 'userLimit' | 'productLimit'>): Promise<Vendor> {
    const vendor = await findVendor(vendorId);

    const vendorClient = await VendorRepo.findByName(name);
    if (vendorClient && vendor.id !== vendorClient.id) {
        throw Boom.conflict('Vendor with this name already exist');
    }

    vendor.name = name;
    await VendorRepo.update(vendor.id, vendor.name);

    const _settings = await VendorSettingsRepo.update(vendor.id, settings);

    vendor.settings = _settings;

    return vendor;
}

export async function updateVendorSettings(vendorId: string, settings: Pick<VendorSettings, 'userLimit' | 'productLimit'>): Promise<VendorSettings> {
    return VendorSettingsRepo.update(vendorId, settings);
}

export async function updateVendorState(vendorId: string, state: VendorState): Promise<Vendor> {
    return VendorRepo.updateState(vendorId, state);
}

export async function deleteVendor(vendorId: string): Promise<void> {
    const vendor = await findVendor(vendorId);

    await VendorRepo.remove(vendorId);
}
