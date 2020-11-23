
import Boom from '@hapi/boom';
import { Customer } from '../models/Customer';
import CustomerRepo from '../repositories/customer';



export async function getAllCustomers(offset: number, limit: number): Promise<[Customer[], number]> {
    return CustomerRepo.getAll(offset, limit);
}

export async function findCustomer(customerId: string): Promise<Customer> {
    const customer = await CustomerRepo.find(customerId);
    if (!customer) {
        throw Boom.notFound('Customer with this id does not exist');
    }

    return customer;
}

export async function createCustomer(firstName: string, lastName: string, hashedPassword: string, email: string, isActive: boolean): Promise<Customer> {
    const brand = await CustomerRepo.findByName(firstName);
    if (brand) {
        throw Boom.conflict('Customer with this name already exist');
    }

    return CustomerRepo.create(firstName, lastName, hashedPassword, email, isActive);
}

export async function updateCustomer(customerId: string, firstName: string, lastName: string, hashedPassword: string, email: string, isActive: boolean): Promise<Customer> {
    const customer = await findCustomer(customerId);

    const _customer = await CustomerRepo.findByName(firstName);
    if (_customer && customer.id !== _customer.id) {
        throw Boom.conflict('Customer with this name already exist');
    }

    customer.firstName = firstName;
    customer.lastName = lastName;
    customer.hashedPassword = hashedPassword;
    customer.email = email;
    customer.isActive = isActive;

    await CustomerRepo.update(customer.id, customer.firstName, customer.lastName, customer.hashedPassword, customer.email, customer.isActive);

    return customer;
}

export async function deleteCustomer(customerId: string): Promise<void> {
    const customer = await findCustomer(customerId);

    await CustomerRepo.remove(customerId);
}