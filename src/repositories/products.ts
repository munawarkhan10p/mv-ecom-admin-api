import { Repository, getConnection } from 'typeorm';

import { Product } from '../models/Product';

class ProductRepo {
private repo: Repository<Product>;

constructor() {
    this.repo = getConnection().getRepository(Product);
}

async getAll(offset: number, limit: number): Promise<[Product[], number]> {
    return this.repo.findAndCount({
        take: limit,
        skip: offset,
    });
}

async find(productId: string): Promise<Product | undefined> {
    return this.repo.findOne({
        where: [
            { id: productId },
        ],
    });
}

async findByName(name: string): Promise<Product | undefined> {
    return this.repo.findOne({
        where: [
            { name },
        ],
    });
}

// async create(name: string, type: CategoryType, description: string, commissionRate: number): Promise<Category> {
//     const category = this.repo.create({ name, type, description, commissionRate });

//     return this.repo.save(category);
// }

// async update(productId: string, name: string, type: CategoryType, description: string, commissionRate: number): Promise<Category> {
//     return this.repo.save({ id: productId, name, type, description, commissionRate });
// }

async remove(productId: string): Promise<void> {
    await this.repo.delete(productId);
}

}

export default new ProductRepo();