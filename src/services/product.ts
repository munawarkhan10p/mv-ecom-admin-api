
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

// export async function updateBrand(brandId: string, name: string, logo: string, status: Status): Promise<Brand> {
//     const brand = await findBrand(brandId);

//     const _brand = await BrandRepo.findByName(name);
//     if (_brand && brand.id !== _brand.id) {
//         throw Boom.conflict('Brand with this name already exist');
//     }

//     brand.name = name;
//     brand.logoPath = logo;
//     brand.status = status;
//     await BrandRepo.update(brand.id, brand.name, brand.logoPath, brand.status);

//     return brand;
// }

export async function deleteProduct(productId: string): Promise<void> {
    const product = await findProduct(productId);

    await ProductRepo.remove(productId);
}