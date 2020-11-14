import { Repository, getConnection } from 'typeorm';

import { VendorSettings } from '../models/VendorSettings';

class VendorSettingsRepo {
    private repo: Repository<VendorSettings>;

    constructor() {
        this.repo = getConnection().getRepository(VendorSettings);
    }

    async find(vendorId: string): Promise<VendorSettings | undefined> {
        const settings = await this.repo.findOne({
            where: [
                { vendor: { id: vendorId } },
            ],
        });

        return settings;
    }

    async update(vendorId: string, settings: Partial<VendorSettings>): Promise<VendorSettings> {
        return this.repo.save({
            ...settings,
            vendor: { id: vendorId },
        });
    }
}

export default new VendorSettingsRepo();
