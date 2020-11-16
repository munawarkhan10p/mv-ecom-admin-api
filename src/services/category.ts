
import Boom from '@hapi/boom';
import { Category } from '../models/Category';
import { CategoryType } from '../models/enums';
import CategoryRepo from '../repositories/category';



export async function getAllCategories(offset: number, limit: number): Promise<[Category[], number]> {
    return CategoryRepo.getAll(offset, limit);
}

export async function findCategory(categoryId: string): Promise<Category> {
    const vendor = await CategoryRepo.find(categoryId);
    if (!vendor) {
        throw Boom.notFound('Category with this id does not exist');
    }

    return vendor;
}

export async function createCategory(name: string, type: CategoryType, description: string, commissionRate: number): Promise<Category> {
    const category = await CategoryRepo.findByName(name);
    if (category) {
        throw Boom.conflict('Category with this name already exist');
    }

    return CategoryRepo.create(name, type, description, commissionRate);
}

export async function updateCategory(categoryId: string, name: string, type: CategoryType, description: string, commissionRate: number): Promise<Category> {
    const category = await findCategory(categoryId);

    const _category = await CategoryRepo.findByName(name);
    if (_category && category.id !== _category.id) {
        throw Boom.conflict('Category with this name already exist');
    }

    category.name = name;
    category.type = type;
    category.description = description;
    category.commissionRate = commissionRate;
    await CategoryRepo.update(category.id, category.name, category.type, category.description, category.commissionRate);

    return category;
}

export async function deleteCategory(vendorId: string): Promise<void> {
    const vendor = await findCategory(vendorId);

    await CategoryRepo.remove(vendorId);
}