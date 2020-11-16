import Joi from '@hapi/joi';
import express, { Router } from 'express';
import { Role, Status } from '../models/enums';

import { authorize } from '../middlewares/authorize';
import { wrapAsync } from '../utils/asyncHandler';

import { Request, isUserReq } from './interfaces';
import { createBrand, deleteBrand, getAllBrands, updateBrand } from '../services/brand';

const router = Router();

/**
 * @swagger
 * /brands:
 *   get:
 *     tags:
 *       - Brand
 *     summary: Get Brand list
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
 *                   name: Brand 1
 *                   logo: path to logo
 *                   status: ACTIVE
 *                 - id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *                   name: Brand 2
 *                   logo: path to logo
 *                   status: ACTIVE
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/brands', authorize(), wrapAsync(async (req: Request, res: express.Response) => {
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

        const [brands, total] = await getAllBrands(offset, limit);

        res.send({
            total,
            data: brands.map((brand) => ({
                id: brand.id,
                name: brand.name,
                logo: brand.logo,
                status: brand.status,
            })),
        });
}));

/**
 * @swagger
 * /brands:
 *   post:
 *     tags:
 *       - Brand
 *     summary: Create a brand
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
 *                 description: Brand name
 *                 type: string
 *               logo:
 *                 description: Brand logo path
 *                 type: string
 *               status:
 *                 description: Brand status
 *                 type: string
 *                 enum: [PHYSICAL, DIGITAL]
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brand'
 *             example:
 *               id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *               name: Brand 1
 *               logo: Path to log
 *               status: ACTIVE
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/brands', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { name, logo, status } = await Joi
        .object({
            name: Joi.string().trim().min(3).max(50).required().label('Name'),
            logo: Joi.string().trim().min(3).max(500).required().label('Logo'),
            status: Joi.string().valid(Status.ACTIVE, Status.DISABLED).required().label('Status'),
        })
        .validateAsync(req.body);

    const brand = await createBrand(name, logo, status);

    res.send({
        id: brand.id,
        name: brand.name,
        logo: brand.logo,
        status: brand.status,
    });
}));

/**
 * @swagger
 * /brands/{brandId}:
 *   put:
 *     tags:
 *       - Brand
 *     summary: Update a Brand
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/brandId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 description: Brand name
 *                 type: string
 *               logo:
 *                 description: Brand logo path
 *                 type: string
 *               status:
 *                 description: Brand status
 *                 type: string
 *                 enum: [ACTIVE, DISABLED]
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brand'
 *             example:
 *               id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *               name: Brand 1
 *               logo: Logo path
 *               type: DISABLED
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/brands/:brandId', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { brandId, name, logo, status } = await Joi
        .object({
            brandId: Joi.string().trim().uuid().required().label('Brand ID'),
            name: Joi.string().trim().min(3).max(50).required().label('Name'),
            logo: Joi.string().trim().min(3).max(500).required().label('Logo'),
            status: Joi.string().valid(Status.ACTIVE, Status.DISABLED).required().label('Status'),
        })
        .validateAsync({
            ...req.body,
            categoryId: req.params.categoryId,
        });

    const brand = await updateBrand(brandId, name, logo, status);

    res.send({
        id: brand.id,
        name: brand.name,
        logo: brand.logo,
        status: brand.status,
    });
}));

/**
 * @swagger
 * /brands/{brandId}:
 *   delete:
 *     tags:
 *       - Brand
 *     summary: Delete a Brand
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/brandId'
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
router.delete('/brands/:brandId', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { brandId } = await Joi
        .object({
            brandId: Joi.string().trim().uuid().required().label('Brand ID'),
        })
        .validateAsync({
            brandId: req.params.brandId,
        });

    await deleteBrand(brandId);

    res.send(204);
}));

export default router;