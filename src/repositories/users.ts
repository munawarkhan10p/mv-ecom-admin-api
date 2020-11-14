import { Repository, getConnection } from 'typeorm';

import { VendorUser } from '../models/VendorUser';
import { Role } from '../models/enums';
import { User } from '../models/User';

class UserRepo {
    private repo: Repository<User>;
    private vendorUserRepo: Repository<VendorUser>;

    constructor() {
        this.repo = getConnection().getRepository(User);
        this.vendorUserRepo = getConnection().getRepository(VendorUser);
    }

    async getAll(roles: Role[], invitationAccepted: boolean | 'all', offset: number, limit: number): Promise<[User[], number]> {
        const query = this.repo.createQueryBuilder('user')
            .where('user.role in (:...roles)', { roles });

        if (invitationAccepted !== 'all') {
            query.andWhere('user.invitationAccepted = :invitationAccepted', { invitationAccepted });
        }

        return query
            .take(limit)
            .skip(offset)
            .getManyAndCount();
    }

    async getAllByVendorId(vendorId: string, invitationAccepted: boolean | 'all', offset: number, limit: number): Promise<[User[], number]> {
        const query = this.repo.createQueryBuilder('user')
            .leftJoinAndSelect('user.vendorUsers', 'vendorUser')
            .where('vendorUser.vendorId = :vendorId', { vendorId: vendorId });

        if (invitationAccepted !== 'all') {
            query.andWhere('user.invitationAccepted = :invitationAccepted', { invitationAccepted });
        }

        return query.take(limit)
            .skip(offset)
            .getManyAndCount();
    }

    async getUserVendors(userId: string): Promise<VendorUser[]> {
        return this.vendorUserRepo.find({
            where: [
                { userId },
            ],
        });
    }

    async findById(userId: string): Promise<User | undefined> {
        const user = await this.repo.findOne({
            where: [
                { id: userId },
            ],
        });

        return user;
    }

    async findByEmail(email: string): Promise<User | undefined> {
        const user = await this.repo.findOne({
            where: [
                { email },
            ],
        });

        return user;
    }

    async findVendorUser(vendorId: string, userId: string): Promise<VendorUser | undefined> {
        const vendorUser = await this.vendorUserRepo.findOne({
            where: [
                { vendorId: vendorId, userId },
            ],
        });

        return vendorUser;
    }

    async create(email: string, role: Role): Promise<User> {
        const user = this.repo.create({ email, role });

        return this.repo.save(user);
    }

    async update(userId: string, user: Partial<Pick<User, 'firstName' | 'lastName' | 'hashedPassword' | 'invitationAccepted'>>): Promise<User> {
        return this.repo.save({
            id: userId,
            ...user,
        });
    }

    async remove(userId: string): Promise<void> {
        await this.repo.delete(userId);
    }

    async upsertToVendor(vendorId: string, userId: string, vendorUser: Partial<Pick<VendorUser, 'role' | 'invitationAccepted'>>): Promise<VendorUser> {
        const _vendorUser = this.vendorUserRepo.create({
            vendorId: vendorId,
            userId,
            ...vendorUser,
        });

        await this.vendorUserRepo.save(_vendorUser);

        return _vendorUser;
    }

    async removeFromVendor(vendorUser: VendorUser): Promise<void> {
        await this.vendorUserRepo.remove(vendorUser);
    }
}

export default new UserRepo();
