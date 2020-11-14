import { Repository, getConnection } from 'typeorm';

import { Vendor } from '../models/Vendor';
import { VendorType, VendorState } from '../models/enums';

class VendorRepo {
    private repo: Repository<Vendor>;

    constructor() {
        this.repo = getConnection().getRepository(Vendor);
    }

    async getAll(offset: number, limit: number): Promise<[Vendor[], number]> {
        return this.repo.findAndCount({
            take: limit,
            skip: offset,
            relations: ['settings'],
        });
    }

    async getAllByUserId(userId: string, invitationAccepted: boolean | 'all', offset: number, limit: number): Promise<[Vendor[], number]> {
        const query = this.repo.createQueryBuilder('vendor')
            .leftJoinAndSelect('vendor.vendorUsers', 'vendorUser')
            .leftJoinAndSelect('vendor.settings', 'settings')
            .where('vendorUser.userId = :userId', { userId });

        if (invitationAccepted !== 'all') {
            query.andWhere('vendorUser.invitationAccepted = :invitationAccepted', { invitationAccepted });
        }

        return query.take(limit)
            .skip(offset)
            .getManyAndCount();
    }

    async find(vendorId: string): Promise<Vendor | undefined> {
        return this.repo.findOne({
            where: [
                { id: vendorId },
            ],
            relations: ['settings'],
        });
    }

    async findByName(name: string): Promise<Vendor | undefined> {
        return this.repo.findOne({
            where: [
                { name },
            ],
            relations: ['settings'],
        });
    }

    async findByStripeCustomerId(stripeCustomerId: string): Promise<Vendor | undefined> {
        return this.repo.findOne({
            where: [
                { stripeCustomerId },
            ],
            relations: ['settings'],
        });
    }

    async create(name: string, type: VendorType, state: VendorState): Promise<Vendor> {
        const vendor = this.repo.create({ name, type, state });

        return this.repo.save(vendor);
    }

    async update(vendorId: string, name: string): Promise<Vendor> {
        return this.repo.save({ id: vendorId, name });
    }

    async updateState(vendorId: string, state: VendorState, stripeCustomerId?: string): Promise<Vendor> {
        return this.repo.save({ id: vendorId, state, stripeCustomerId });
    }

    async remove(vendorId: string): Promise<void> {
        await this.repo.delete(vendorId);
    }
}

export default new VendorRepo();
