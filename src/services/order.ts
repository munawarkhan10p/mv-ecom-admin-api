
import Boom from '@hapi/boom';
import { Product } from '../models/Product';
import { ProductStatus } from '../models/enums';
import ProductRepo from '../repositories/products';



export async function getAllProducts(offset: number, limit: number): Promise<[Product[], number]> {
    return ProductRepo.getAll(offset, limit);
}