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
import { createProduct, deleteProduct, getAllProducts, updateProduct } from '../services/product';

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
 *               $ref: '#/components/schemas/Product'
 *             example:
 *               id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *               name: Product 1
 *               price: 25
 *               status: IN_STOCK   
 *               imagesPath: ['https://${config.s3.Images}.s3.amazonaws.com/${req.file.originalname}']
 *               categoryId: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *               vendorId: 4efa52e5-e6fd-4bd0-68bc-0132b2e83ww49
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/products', authorize([Role.ADMIN, Role.VENDOR]), upload.array('imagesPath'), wrapAsync(async (req: Request, res: express.Response) => {


    Array(req.files).forEach( file => {
        console.log('files are',file);
    })
    
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

/**
 * @swagger
 * /products/{productId}:
 *   put:
 *     tags:
 *       - Product
 *     summary: Update a Product
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/productId'
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
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *             example:
 *               id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *               name: Product 1
 *               price: 25
 *               status: IN_STOCK   
 *               imagesPath: ['https://${config.s3.Images}.s3.amazonaws.com/${req.file.originalname}']
 *               categoryId: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *               vendorId: 4efa52e5-e6fd-4bd0-68bc-0132b2e83ww49
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/products/:productId', authorize(Role.ADMIN), upload.array('brandImage'), wrapAsync(async (req: Request, res: express.Response) => {
    
    
    const { productId, name, price, status, categoryId, vendorId } = await Joi
        .object({
            productId: Joi.string().trim().uuid().required().label('Product ID'),
            name: Joi.string().trim().min(3).max(50).required().label('Name'),
            price: Joi.number().min(1).max(10000).required().label('Price'),
            status: Joi.string().valid(ProductStatus.IN_STOCK, ProductStatus.OUT_OF_STOCK, ProductStatus.RUNNING_LOW).required().label('Status'),
            categoryId: Joi.string().trim().uuid().required().label('Category ID'),
            vendorId: Joi.string().trim().uuid().required().label('Vendor ID'),
            
        })
        .validateAsync({
            ...req.body,
            productId: req.params.productId,
        });
        
    const product = await updateProduct(productId, name, price, status, [''], categoryId, vendorId);

    res.send({
        id: product.id,
        name: product.name,
        price: product.price,
        status: product.status,
        categoryId: product.category.id,
        vendorId: product.vendor.id
    });
}));

/**
 * @swagger
 * /products/{productId}:
 *   delete:
 *     tags:
 *       - Product
 *     summary: Delete a Product
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/productId'
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
router.delete('/products/:productId', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { productId } = await Joi
        .object({
            productId: Joi.string().trim().uuid().required().label('Brand ID'),
        })
        .validateAsync({
            productId: req.params.productId,
        });

    await deleteProduct(productId);

    res.send(204);
}));


export default router;