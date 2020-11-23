import { Repository, getConnection } from 'typeorm';

import { Customer } from '../models/Customer';

class CustomerRepo {
private repo: Repository<Customer>;

constructor() {
    this.repo = getConnection().getRepository(Customer);
}

async getAll(offset: number, limit: number): Promise<[Customer[], number]> {
    return this.repo.findAndCount({
        take: limit,
        skip: offset,
    });
}

async find(customerId: string): Promise<Customer | undefined> {
    return this.repo.findOne({
        where: [
            { id: customerId },
        ],
    });
}

async findByName(firstName: string): Promise<Customer | undefined> {
    return this.repo.findOne({
        where: [
            { firstName },
        ],
    });
}

async create(firstName: string, lastName: string, hashedPassword: string, email: string, isActive: boolean): Promise<Customer> {
    const customer = this.repo.create({ firstName, lastName, hashedPassword, email, isActive });

    return this.repo.save(customer);
}

async update(customerId: string, firstName: string, lastName: string, hashedPassword: string, email: string, isActive: boolean): Promise<Customer> {
    return this.repo.save({ id: customerId, firstName, lastName, hashedPassword, email, isActive });
}

async remove(customerId: string): Promise<void> {
    await this.repo.delete(customerId);
}

}

export default new CustomerRepo();