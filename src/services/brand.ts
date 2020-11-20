
import Boom from '@hapi/boom';
import { Brand } from '../models/Brand';
import { CategoryType, Status } from '../models/enums';
import BrandRepo from '../repositories/brand';



export async function getAllBrands(offset: number, limit: number): Promise<[Brand[], number]> {
    return BrandRepo.getAll(offset, limit);
}

export async function findBrand(brandId: string): Promise<Brand> {
    const brand = await BrandRepo.find(brandId);
    if (!brand) {
        throw Boom.notFound('Brand with this id does not exist');
    }

    return brand;
}

export async function createBrand(name: string, logo: string, status: Status): Promise<Brand> {
    const brand = await BrandRepo.findByName(name);
    if (brand) {
        throw Boom.conflict('Brand with this name already exist');
    }

    return BrandRepo.create(name, logo, status);
}

export async function updateBrand(brandId: string, name: string, logo: string, status: Status): Promise<Brand> {
    const brand = await findBrand(brandId);

    const _brand = await BrandRepo.findByName(name);
    if (_brand && brand.id !== _brand.id) {
        throw Boom.conflict('Brand with this name already exist');
    }

    brand.name = name;
    brand.logoPath = logo;
    brand.status = status;
    await BrandRepo.update(brand.id, brand.name, brand.logoPath, brand.status);

    return brand;
}

export async function deleteBrand(brandId: string): Promise<void> {
    const brand = await findBrand(brandId);

    await BrandRepo.remove(brandId);
}