import { ProductStatus } from 'src/models/enums';
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

async create(name: string, price: number, status: ProductStatus, imagesPath: string[], categoryId: string, vendorId: string): Promise<Product> {
    const product = this.repo.create({ name, price, status, imagesPath, categoryId, vendorId});
    
    return this.repo.save(product);
}

async update(productId: string, name: string, price: number, status: ProductStatus, imagesPath: string[], categoryId: string, vendorId: string): Promise<Product> {
    return this.repo.save({ id: productId, name, price, status, imagesPath, categoryId, vendorId });
}

async remove(productId: string): Promise<void> {
    await this.repo.delete(productId);
}

}

export default new ProductRepo();