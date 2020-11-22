import Joi from '@hapi/joi';
import express, { Router } from 'express';
import { ProductStatus, Role, } from '../models/enums';

import { authorize } from '../middlewares/authorize';
import { wrapAsync } from '../utils/asyncHandler';

import { Request, isUserReq } from './interfaces';
import { createBrand, deleteBrand, getAllBrands, updateBrand } from '../services/brand';
import multer from 'multer';
import fs from 'fs';

import { S3 } from '../utils/aws';
import config from '../config';
import { createProduct, getAllProducts } from '../services/product';

const upload = multer({ dest: '/tmp/' })

const router = Router();

/**
 * @swagger
 * /products:
 *   get:
 *     tags:
 *       - Product
 *     summary: Get Product list
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
 *                     $ref: '#/components/schemas/Product'
 *             example:
 *               total: 2
 *               data:
 *                 - id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *                   name: Brand 1
 *                   price: 30
 *                   status: IN_STOCK
 *                 - id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *                   name: Brand 2
 *                   price: 32
 *                   status: IN_STOCK
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/products', authorize(), wrapAsync(async (req: Request, res: express.Response) => {
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

        const [products, total] = await getAllProducts(offset, limit);

        res.send({
            total,
            data: products.map((product) => ({
                id: product.id,
                name: product.name,
                price: product.price,
                status: product.status,
            })),
        });
}));

/**
 * @swagger
 * /products:
 *   post:
 *     tags:
 *       - Product
 *     summary: Create a product
 *     consumes:
 *       - multipart/form-data
 *     security:
 *       - JWT: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 description: Product name
 *                 type: string
 *               price:
 *                 description: Product price
 *                 type: string
 *               status:
 *                 description: Product status
 *                 type: string
 *                 enum: [OUT_OF_STOCK, IN_STOCK, RUNNING_LOW]
 *               imagesPath:
 *                 description: Product logo 
 *                 type: array
 *                 items:
 *                   type: string 
 *                   format: binary     
 *               categoryId:
 *                 type: string
 *               vendorId:
 *                 type: string
 *     produces:
 *       - multipart/form-data
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
 *               logoPath: Path to  brand image
 *               status: ACTIVE
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/products', authorize([Role.ADMIN, Role.VENDOR]), upload.array('imagesPath'), wrapAsync(async (req: Request, res: express.Response) => {

    const { name, price, status, categoryId, vendorId } = await Joi
        .object({
            name: Joi.string().trim().min(3).max(50).required().label('Name'),
            price: Joi.number().min(1).max(10000).required().label('Price'),
            status: Joi.string().valid(ProductStatus.IN_STOCK, ProductStatus.OUT_OF_STOCK, ProductStatus.RUNNING_LOW).required().label('Status'),
            categoryId: Joi.string().trim().uuid().required().label('Category ID'),
            vendorId: Joi.string().trim().uuid().required().label('Vendor ID'),
            
        })
        .validateAsync(req.body);
        
    const product = await createProduct(name, price, status, [''], categoryId, vendorId);

    res.send({
        id: product.id,
        name: product.name,
        price: product.price,
        status: product.status,
        categoryId: product.categoryId,
        vendorId: product.vendorId
    });
}));

export default router;