import Joi from '@hapi/joi';
import express, { Router } from 'express';
import { CategoryType, Role } from '../models/enums';
import { createCategory, deleteCategory, getAllCategories, updateCategory } from '../services/category';

import { authorize } from '../middlewares/authorize';
import { wrapAsync } from '../utils/asyncHandler';

import { Request, isUserReq } from './interfaces';
import { createCustomer, deleteCustomer, getAllCustomers, updateCustomer } from '../services/customer';

const router = Router();

/**
 * @swagger
 * /customers:
 *   get:
 *     tags:
 *       - Customer
 *     summary: Get Customer list
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/offset'
 *       - $ref: '#/components/parameters/limit'
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 total:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Customer'
 *             example:
 *               total: 2
 *               data:
 *                 - id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *                   firstName: Munawar
 *                   lastName: khan
 *                   hashedPassword: c43a3b0dss-e794-4a9c-r9ec12-e35c6b62de4cr
 *                   email: munawar.khan@gmail.com
 *                   isActive: true
 *                 - id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *                   firstName: Munawar
 *                   lastName: khan
 *                   hashedPassword: c43a3b0dss-e794-4a9c-r9ec12-e35c6b62de4cr
 *                   email: munawar.khan@gmail.com
 *                   isActive: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/customers', authorize(), wrapAsync(async (req: Request, res: express.Response) => {
    if (!isUserReq(req)) {
        throw new Error('User not found in session');
    }

    const { limit, offset } = await Joi
        .object({
            offset: Joi.number().integer().default(0).failover(0).label('Offset'),
            limit: Joi.number().integer().default(10).failover(10).label('Limit'),
        })
        .validateAsync({
            offset: req.query.offset,
            limit: req.query.limit,
        });

        const [customers, total] = await getAllCustomers(offset, limit);

        res.send({
            total,
            data: customers.map((customer) => ({
                id: customer.id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                hashedPassword: customer.hashedPassword,
                email: customer.email,
                isActive: customer.isActive
            })),
        });
}));

/**
 * @swagger
 * /customers:
 *   post:
 *     tags:
 *       - Customer
 *     summary: Create a customer
 *     security:
 *       - JWT: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 description: Customer first name
 *                 type: string
 *               lastName:
 *                 description: Customer last name
 *                 type: string
 *               hashedPassword:
 *                 description: Customer password
 *                 type: string
 *               email:
 *                 description: Customer email
 *                 type: string
 *               isActive:
 *                 description: Customer is active
 *                 type: boolean
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *             example:
 *               id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *               firstName: Munawar
 *               lastName: khan
 *               hashedPassword: c43a3b0dss-e794-4a9c-r9ec12-e35c6b62de4cr
 *               email: munawar.khan@gmail.com
 *               isActive: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/customers', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { firstName, lastName, hashedPassword, email, isActive } = await Joi
        .object({
            firstName: Joi.string().trim().min(3).max(50).required().label('First Name'),
            lastName: Joi.string().trim().min(3).max(500).required().label('Last Name'),
            hashedPassword: Joi.string().required().label('Password'),
            email: Joi.string().trim().lowercase().email().required().label('Email'),
            isActive: Joi.boolean().required().label('Is Active'),
        })
        .validateAsync(req.body);

    const customer = await createCustomer(firstName, lastName, hashedPassword, email, isActive);

    res.send({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        hashedPassword: customer.hashedPassword,
        email: customer.email,
        isActive: customer.isActive
    });
}));

/**
 * @swagger
 * /customer/{customerId}:
 *   put:
 *     tags:
 *       - Customer
 *     summary: Update a Customer
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/customerId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 description: Customer first name
 *                 type: string
 *               lastName:
 *                 description: Customer last name
 *                 type: string
 *               hashedPassword:
 *                 description: Customer password
 *                 type: string
 *               email:
 *                 description: Customer email
 *                 type: string
 *               isActive:
 *                 description: Customer is active
 *                 type: boolean
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *             example:
 *               id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *               firstName: Munawar
 *               lastName: khan
 *               hashedPassword: c43a3b0dss-e794-4a9c-r9ec12-e35c6b62de4cr
 *               email: munawar.khan@gmail.com
 *               isActive: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/customer/:customerId', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
        const { customerId, firstName, lastName, hashedPassword, email, isActive } = await Joi
        .object({
            customerId: Joi.string().trim().uuid().required().label('Customer ID'),
            firstName: Joi.string().trim().min(3).max(50).required().label('First Name'),
            lastName: Joi.string().trim().min(3).max(500).required().label('Last Name'),
            hashedPassword: Joi.string().required().label('Password'),
            email: Joi.string().trim().lowercase().email().required().label('Email'),
            isActive: Joi.boolean().required().label('Is Active'),
        })
        .validateAsync({
            ...req.body,
            customerId: req.params.customerId,
        });

    const customer = await updateCustomer(customerId, firstName, lastName, hashedPassword, email, isActive);

    res.send({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        hashedPassword: customer.hashedPassword,
        email: customer.email,
        isActive: customer.isActive
    });
}));

/**
 * @swagger
 * /customer/{customerId}:
 *   delete:
 *     tags:
 *       - Customer
 *     summary: Delete a Customer
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/customerId'
 *     produces:
 *       - application/json
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContentResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/customer/:customerId', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { customerId } = await Joi
        .object({
            customerId: Joi.string().trim().uuid().required().label('Customer ID'),
        })
        .validateAsync({
            customerId: req.params.customerId,
        });

    await deleteCustomer(customerId);

    res.send(204);
}));

export default router;