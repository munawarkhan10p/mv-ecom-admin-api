import Joi from '@hapi/joi';
import express, { Router } from 'express';

import { authorize } from '../middlewares/authorize';
import { Role, VendorType } from '../models/enums';
import { createVendor, getAllVendors, findVendor, updateVendor, getAllUserVendors, deleteVendor } from '../services/vendors';
import { wrapAsync } from '../utils/asyncHandler';

import { Request, isUserReq } from './interfaces';

const router = Router();

/**
 * @swagger
 * /vendors:
 *   get:
 *     tags:
 *       - Vendor
 *     summary: Get Vendor list
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/offset'
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/clientInvitationAccepted'
 *       - $ref: '#/components/parameters/clientInvitationPending'
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
 *                     $ref: '#/components/schemas/Vendor'
 *             example:
 *               total: 2
 *               data:
 *                 - id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *                   name: Vendor1
 *                   type: INTERNAL
 *                   state: NORMAL
 *                   settings:
 *                     userLimit: 10
 *                     productLimit: 10
 *                 - id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *                   name: Vendor2
 *                   type: EXTERNAL
 *                   state: NORMAL
 *                   settings:
 *                     userLimit: 10
 *                     productLimit: 10
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/vendors', authorize(), wrapAsync(async (req: Request, res: express.Response) => {
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

    if (req.user.role === Role.ADMIN) {
        const [vendors, total] = await getAllVendors(offset, limit);

        res.send({
            total,
            data: vendors.map((vendor) => ({
                id: vendor.id,
                name: vendor.name,
                type: vendor.type,
                state: vendor.state,
                settings: {
                    userLimit: vendor.settings.userLimit,
                    productLimit: vendor.settings.productLimit,
                },
            })),
        });
    } else {
        const { accepted, pending } = await Joi
            .object({
                accepted: Joi.bool().default(false).failover(false).label('Invitation accepted'),
                pending: Joi.bool().default(false).failover(false).label('Invitation pending'),
            })
            .validateAsync({
                accepted: req.query.accepted,
                pending: req.query.pending,
            });

        const invitationAccepted = accepted === pending ? 'all' : accepted;
        const [vendors, total] = await getAllUserVendors(req.user.id, invitationAccepted, offset, limit);

        res.send({
            total,
            data: vendors.map((vendor) => ({
                id: vendor.id,
                name: vendor.name,
                type: vendor.type,
                state: vendor.state,
                vendorRole: vendor.vendorUsers[0].role,
                invitationAccepted: vendor.vendorUsers[0].invitationAccepted,
                settings: {
                    userLimit: vendor.settings.userLimit,
                    productLimit: vendor.settings.productLimit,
                },
            })),
        });
    }
}));

/**
 * @swagger
 * /vendors/{vendorId}:
 *   get:
 *     tags:
 *       - Vendor
 *     summary: Get a Vendor
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/vendorId'
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vendor'
 *             example:
 *               id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *               name: Vendor1
 *               type: INTERNAL
 *               state: NORMAL
 *               settings:
 *                 userLimit: 5
 *                 productLimit: 5
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/vendors/:vendorId', authorize([Role.ADMIN, Role.VENDOR]), wrapAsync(async (req: Request, res: express.Response) => {
    const { clientId: vendorId } = await Joi
        .object({
            vendorId: Joi.string().trim().uuid().required().label('Vendor ID'),
        })
        .validateAsync({
            vendorId: req.params.vendorId,
        });

    const vendor = await findVendor(vendorId);

    res.send({
        id: vendor.id,
        name: vendor.name,
        type: vendor.type,
        state: vendor.state,
        settings: {
            userLimit: vendor.settings.userLimit,
            productLimit: vendor.settings.productLimit,
        },
    });
}));

/**
 * @swagger
 * /vendors:
 *   post:
 *     tags:
 *       - Vendor
 *     summary: Create an Internal Vendor
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
 *                 description: Vendor name
 *                 type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   userLimit:
 *                     description: User limit
 *                     type: number
 *                   targetLimit:
 *                     description: Product limit
 *                     type: number
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vendor'
 *             example:
 *               id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *               name: Vendor1
 *               type: INTERNAL
 *               state: NORMAL
 *               settings:
 *                 userLimit: 5
 *                 productLimit: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/vendors', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { name, settings } = await Joi
        .object({
            name: Joi.string().trim().min(3).max(50).required().label('Name'),
            settings: Joi.object({
                userLimit: Joi.number().integer().min(1).required().label('User limit'),
                productLimit: Joi.number().integer().min(0).required().label('Product limit'),
            }).label('Settings'),
        })
        .validateAsync(req.body);

    const vendor = await createVendor(name, VendorType.INTERNAL, settings);

    res.send({
        id: vendor.id,
        name: vendor.name,
        type: vendor.type,
        state: vendor.state,
        settings: {
            userLimit: vendor.settings.userLimit,
            productLimit: vendor.settings.productLimit,
        },
    });
}));

/**
 * @swagger
 * /vendors/{vendorId}:
 *   put:
 *     tags:
 *       - Vendor
 *     summary: Update a Vendor
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/vendorId'
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
 *               settings:
 *                 type: object
 *                 properties:
 *                   userLimit:
 *                     description: User limit
 *                     type: number
 *                   targetLimit:
 *                     description: Product limit
 *                     type: number
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vendor'
 *             example:
 *               id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *               name: Vendor1
 *               type: INTERNAL
 *               state: NORMAL
 *               settings:
 *                 userLimit: 5
 *                 productLimit: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/vendors/:vendorId', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { vendorId, name, settings } = await Joi
        .object({
            vendorId: Joi.string().trim().uuid().required().label('Vendor ID'),
            name: Joi.string().trim().min(3).max(50).required().label('Name'),
            settings: Joi.object({
                userLimit: Joi.number().integer().min(1).required().label('User limit'),
                productLimit: Joi.number().integer().min(0).required().label('Product limit'),
            }).label('Settings'),
        })
        .validateAsync({
            ...req.body,
            vendorId: req.params.vendorId,
        });

    const vendor = await updateVendor(vendorId, name, settings);

    res.send({
        id: vendor.id,
        name: vendor.name,
        type: vendor.type,
        state: vendor.state,
        settings: {
            userLimit: vendor.settings.userLimit,
            productLimit: vendor.settings.productLimit,
        },
    });
}));

/**
 * @swagger
 * /vendors/{vendorId}:
 *   delete:
 *     tags:
 *       - Vendor
 *     summary: Delete a Vendor
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/vendorId'
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
router.delete('/vendors/:vendorId', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { vendorId } = await Joi
        .object({
            vendorId: Joi.string().trim().uuid().required().label('Vendor ID'),
        })
        .validateAsync({
            vendorId: req.params.vendorId,
        });

    await deleteVendor(vendorId);

    res.send(204);
}));

export default router;
