import { Status } from '../models/enums';
import { Repository, getConnection } from 'typeorm';

import { Brand } from '../models/Brand';

class BrandRepo {
private repo: Repository<Brand>;

constructor() {
    this.repo = getConnection().getRepository(Brand);
}

async getAll(offset: number, limit: number): Promise<[Brand[], number]> {
    return this.repo.findAndCount({
        take: limit,
        skip: offset,
    });
}

async find(brandId: string): Promise<Brand | undefined> {
    return this.repo.findOne({
        where: [
            { id: brandId },
        ],
    });
}

async findByName(name: string): Promise<Brand | undefined> {
    return this.repo.findOne({
        where: [
            { name },
        ],
    });
}

async create(name: string, logoPath: string, status: Status): Promise<Brand> {
    const brand = this.repo.create({ name, logoPath, status });

    return this.repo.save(brand);
}

async update(brandId: string,name: string, logo: string, status: Status): Promise<Brand> {
    return this.repo.save({ id: brandId, name, logo, status });
}

async remove(brandId: string): Promise<void> {
    await this.repo.delete(brandId);
}

}

export default new BrandRepo();