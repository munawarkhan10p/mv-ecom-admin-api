import { Repository, getConnection, FindConditions } from 'typeorm';

import { AccountRequest } from '../models/AccountRequest';
import { AccountRequestStatus } from '../models/enums';

class AccountRequestRepo {
    private repo: Repository<AccountRequest>;

    constructor() {
        this.repo = getConnection().getRepository(AccountRequest);
    }

    async getAll(status: AccountRequestStatus | 'all', offset: number, limit: number): Promise<[AccountRequest[], number]> {
        let where: FindConditions<AccountRequest> | undefined = undefined;
        if (status !== 'all') {
            where = { status };
        }

        return this.repo.findAndCount({
            where,
            take: limit,
            skip: offset,
        });
    }

    async find(accRequestId: string): Promise<AccountRequest | undefined> {
        return this.repo.findOne({
            where: [
                { id: accRequestId },
            ],
        });
    }

    async create(firstName: string, lastName: string, email: string, company: string, description: string): Promise<AccountRequest> {
        const accRequest = this.repo.create({ firstName, lastName, email, company, description });

        return this.repo.save(accRequest);
    }

    async updateStatus(accRequestId: string, status: AccountRequestStatus): Promise<AccountRequest> {
        return this.repo.save({ id: accRequestId, status });
    }
}

export default new AccountRequestRepo();
