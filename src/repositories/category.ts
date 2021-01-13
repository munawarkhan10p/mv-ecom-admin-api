import { CategoryType } from '../models/enums';
import { Repository, getConnection } from 'typeorm';

import { Category } from '../models/Category';

class CategoryRepo {
private repo: Repository<Category>;

constructor() {
    this.repo = getConnection().getRepository(Category);
}

async getAll(offset: number, limit: number): Promise<[Category[], number]> {
    return this.repo.findAndCount({
        take: limit,
        skip: offset,
    });
}

async find(categoryId: string): Promise<Category | undefined> {
    return this.repo.findOne({
        where: [
            { id: categoryId },
        ],
    });
}

async findByName(name: string): Promise<Category | undefined> {
    return this.repo.findOne({
        where: [
            { name },
        ],
    });
}

async create(name: string, type: CategoryType, description: string, commissionRate: number): Promise<Category> {
    const category = this.repo.create({ name, type, description, commissionRate });

    return this.repo.save(category);
}

async update(categoryId: string, name: string, type: CategoryType, description: string, commissionRate: number): Promise<Category> {
    return this.repo.save({ id: categoryId, name, type, description, commissionRate });
}

async remove(categoryId: string): Promise<void> {
    await this.repo.delete(categoryId);
}

}

export default new CategoryRepo();
//purpose for new is to create singleton