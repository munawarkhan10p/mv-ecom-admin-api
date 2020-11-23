
import Boom from '@hapi/boom';
import { Product } from '../models/Product';
import { ProductStatus } from '../models/enums';
import ProductRepo from '../repositories/products';



export async function getAllProducts(offset: number, limit: number): Promise<[Product[], number]> {
    return ProductRepo.getAll(offset, limit);
}

export async function findProduct(productId: string): Promise<Product> {
    const product = await ProductRepo.find(productId);
    if (!product) {
        throw Boom.notFound('Product with this id does not exist');
    }

    return product;
}

export async function createProduct(name: string, price: number, status: ProductStatus, imagesPath: string[], categoryId: string, vendorId: string): Promise<Product> {
    const product = await ProductRepo.findByName(name);
    if (product) {
        throw Boom.conflict('Product with this name already exist');
    }

    return ProductRepo.create(name, price, status, imagesPath, categoryId, vendorId);
}

export async function updateProduct(productId: string, name: string, price: number, status: ProductStatus, imagesPath: string[], categoryId: string, vendorId: string): Promise<Product> {
    const product = await findProduct(productId);

    const _product = await ProductRepo.findByName(name);
    if (_product && product.id !== _product.id) {
        throw Boom.conflict('Product with this name already exist');
    }

    product.name = name;
    product.price = price;
    product.status = status;
    product.imagesPath = imagesPath;
    product.categoryId = categoryId;
    product.vendorId = vendorId;

    await ProductRepo.update(product.id, name, price, status, imagesPath, categoryId, vendorId);

    return product;
}

export async function deleteProduct(productId: string): Promise<void> {
    const product = await findProduct(productId);

    await ProductRepo.remove(productId);
}