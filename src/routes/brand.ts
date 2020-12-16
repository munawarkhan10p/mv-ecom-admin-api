import Joi from '@hapi/joi';
import express, { Router } from 'express';
import { Role, Status } from '../models/enums';
import { DeleteObjectOutput, HeadObjectOutput } from "aws-sdk/clients/s3";

import { authorize } from '../middlewares/authorize';
import { wrapAsync } from '../utils/asyncHandler';

import { Request, isUserReq } from './interfaces';
import { createBrand, deleteBrand, findBrand, getAllBrands, updateBrand } from '../services/brand';
import multer from 'multer';
import fs from 'fs';

import { S3 } from '../utils/aws';
import config from '../config';
import AWS from 'aws-sdk';

const upload = multer({ dest: '/tmp/' })

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
 *                   logoPath: path to logo
 *                   status: ACTIVE
 *                 - id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *                   name: Brand 2
 *                   logoPath: path to logo
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
                logo:  S3.getSignedUrl('getObject', {
                    Bucket: config.s3.Images,
                    Key: brand.logoPath,
                    Expires: 5 * 60,
                }),
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
 *                 description: Brand name
 *                 type: string
 *               status:
 *                 description: Brand status
 *                 type: string
 *                 enum: [ACTIVE, DISABLED]
 *               brandImage:
 *                 type: string
 *                 format: binary 
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
router.post('/brands', authorize(Role.ADMIN), upload.single('brandImage'), wrapAsync(async (req: Request, res: express.Response) => {
    const { name, status } = await Joi
        .object({
            name: Joi.string().trim().min(3).max(50).required().label('Name'),
            status: Joi.string().valid(Status.ACTIVE, Status.DISABLED).required().label('Status'),
            // logo: Joi.any().label('Logo'),
        })
        .validateAsync(req.body);

    const stream = fs.createReadStream(req.file.path);
    
    await S3.putObject({
        Bucket: config.s3.Images,
        Key: req.file.originalname,
        Body: stream,
        ContentType: req.file.mimetype,
    }).promise();

    // const url = `https://${config.s3.Images}.s3.amazonaws.com/${req.file.originalname}`;
        
    const brand = await createBrand(name, req.file.originalname, status);

    res.send({
        id: brand.id,
        name: brand.name,
        logo: brand.logoPath,
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 description: Brand name
 *                 type: string
 *               brandImage:
 *                 description: Brand logo 
 *                 type: string
 *                 format: binary
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
router.put('/brands/:brandId', authorize(Role.ADMIN), upload.single('brandImage'), wrapAsync(async (req: Request, res: express.Response) => {
    const { brandId, name, status } = await Joi
        .object({
            brandId: Joi.string().trim().uuid().required().label('Brand ID'),
            name: Joi.string().trim().min(3).max(50).required().label('Name'),
            status: Joi.string().valid(Status.ACTIVE, Status.DISABLED).required().label('Status'),
            // logo: Joi.string().trim().min(3).max(500).required().label('Logo'),
        })
        .validateAsync({
            ...req.body,
            brandId: req.params.brandId,
        });

        const stream = fs.createReadStream(req.file.path);
    
        await S3.putObject({
            Bucket: config.s3.Images,
            Key: req.file.originalname,
            Body: stream,
            ContentType: req.file.mimetype,
        }).promise();
    
        const url = `https://${config.s3.Images}.s3.amazonaws.com/${req.file.originalname}`;

    const brand = await updateBrand(brandId, name, url, status);

    res.send({
        id: brand.id,
        name: brand.name,
        logo: brand.logoPath,
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

    const brand = await findBrand(brandId);
    
    try{

    const deleteObject = await s3Delete(config.s3.Images,brand.logoPath );
    } catch(e){
        console.error(e);
    }

    await deleteBrand(brandId);

    res.send(204);
}));

export async function s3Delete(bucketName: string, keyName: string): Promise<DeleteObjectOutput> {
    const s3 = new AWS.S3();

    return new Promise((resolve, reject) => {
        try {
            s3.deleteObject({ Bucket: bucketName, Key: keyName }, (err, data) => {
                if (err != null || data == null) {
                    reject();
                    console.log('reject');
                } else {
                    resolve(data);
                    console.log('resolve');
                }
            });
        } catch {
            reject();
        }
    });
}

export default router;