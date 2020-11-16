import Joi from '@hapi/joi';
import express, { Router } from 'express';
import { CategoryType, Role } from '../models/enums';
import { createCategory, deleteCategory, getAllCategories, updateCategory } from '../services/category';

import { authorize } from '../middlewares/authorize';
import { wrapAsync } from '../utils/asyncHandler';

import { Request, isUserReq } from './interfaces';

const router = Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     tags:
 *       - Category
 *     summary: Get Category list
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
 *                     $ref: '#/components/schemas/Category'
 *             example:
 *               total: 2
 *               data:
 *                 - id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *                   name: Category 1
 *                   type: PHYSICAL
 *                   description: This is apparel category
 *                   commissionRate: 5
 *                 - id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *                   name: Category 2
 *                   type: PHYSICAL
 *                   description: This is apparel 1 category
 *                   commissionRate: 7
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/categories', authorize(), wrapAsync(async (req: Request, res: express.Response) => {
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

        const [categories, total] = await getAllCategories(offset, limit);
    console.log('inside methods', categories);

        res.send({
            total,
            data: categories.map((category) => ({
                id: category.id,
                name: category.name,
                type: category.type,
                description: category.description,
                commissionRate: category.commissionRate
            })),
        });
}));

/**
 * @swagger
 * /categories:
 *   post:
 *     tags:
 *       - Category
 *     summary: Create a category
 *     security:
 *       - JWT: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 description: Category name
 *                 type: string
 *               type:
 *                 description: Category type
 *                 type: string
 *                 enum: [PHYSICAL, DIGITAL]
 *               description:
 *                 description: Category description
 *                 type: string
 *               commissionRate:
 *                 description: Category commmission rate
 *                 type: number
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *             example:
 *               id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *               name: Category 1
 *               type: PHYSICAL
 *               description: This is apparel category
 *               commissionRate: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/categories', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { name, type, description, commissionRate } = await Joi
        .object({
            name: Joi.string().trim().min(3).max(50).required().label('Name'),
            type: Joi.string().valid(CategoryType.PHYSICAL, CategoryType.DIGITAL).required().label('Type'),
            description: Joi.string().trim().min(3).max(500).required().label('Description'),
            commissionRate: Joi.number().integer().min(1).required().label('Commission Rate'),
        })
        .validateAsync(req.body);

    const category = await createCategory(name, type, description, commissionRate);

    res.send({
        id: category.id,
        name: category.name,
        type: category.type,
        description: category.description,
        commissionRate: category.commissionRate
    });
}));

/**
 * @swagger
 * /categories/{categoryId}:
 *   put:
 *     tags:
 *       - Category
 *     summary: Update a Category
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/categoryId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 description: Vendor name
 *                 type: string
 *               type:
 *                 description: Category type
 *                 type: string
 *                 enum: [PHYSICAL, DIGITAL]
 *               description:
 *                 description: Category description
 *                 type: string
 *               commissionRate:
 *                 description: Category commmission rate
 *                 type: number
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *             example:
 *               id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *               name: Category 1
 *               type: PHYSICAL
 *               description: This is apparel category
 *               commissionRate: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/categories/:categoryId', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { categoryId, name, type, description, commissionRate } = await Joi
        .object({
            categoryId: Joi.string().trim().uuid().required().label('Category ID'),
            name: Joi.string().trim().min(3).max(50).required().label('Name'),
            type: Joi.string().valid(CategoryType.PHYSICAL, CategoryType.DIGITAL).required().label('Type'),
            description: Joi.string().trim().min(3).max(500).required().label('Description'),
            commissionRate: Joi.number().integer().min(1).required().label('Commission Rate'),
        })
        .validateAsync({
            ...req.body,
            categoryId: req.params.categoryId,
        });

    const category = await updateCategory(categoryId, name, type, description, commissionRate);

    res.send({
        id: category.id,
        name: category.name,
        type: category.type,
        description: category.description,
        commissionRate: category.commissionRate

    });
}));

/**
 * @swagger
 * /categories/{categoryId}:
 *   delete:
 *     tags:
 *       - Category
 *     summary: Delete a Category
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/categoryId'
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
router.delete('/categories/:categoryId', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { categoryId } = await Joi
        .object({
            categoryId: Joi.string().trim().uuid().required().label('Category ID'),
        })
        .validateAsync({
            categoryId: req.params.categoryId,
        });

    await deleteCategory(categoryId);

    res.send(204);
}));

export default router;