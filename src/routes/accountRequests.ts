import Joi from '@hapi/joi';
import express, { Router } from 'express';

import { authorize } from '../middlewares/authorize';
import { Role, AccountRequestStatus } from '../models/enums';
import { getAllAccountRequests, createAccountRequest, approveAccountRequest, rejectAccountRequest } from '../services/accountRequests';
import { wrapAsync } from '../utils/asyncHandler';

import { Request } from './interfaces';

const router = Router();

/**
 * @swagger
 * /accountRequests:
 *   get:
 *     tags:
 *       - Account Request
 *     summary: Get Account Requests
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
 *                     $ref: '#/components/schemas/AccountRequest'
 *             example:
 *               total: 2
 *               data:
 *                 - id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *                   firstName: Ali
 *                   lastName: Yousuf
 *                   email: ali.yousuf@10pearls.com
 *                   company: 10Pearls
 *                   description: Some description
 *                   status: UNDECIDED
 *                 - id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *                   firstName: Fahad
 *                   lastName: Azhar
 *                   email: fahad.azhar@tenpearls.com
 *                   company: Ten Pearls
 *                   description: Some description
 *                   status: UNDECIDED
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/accountRequests', authorize([Role.ADMIN]), wrapAsync(async (req: Request, res: express.Response) => {
    const { limit, offset } = await Joi
        .object({
            offset: Joi.number().integer().default(0).failover(0).label('Offset'),
            limit: Joi.number().integer().default(10).failover(10).label('Limit'),
        })
        .validateAsync({
            offset: req.query.offset,
            limit: req.query.limit,
        });

    const [accRequests, total] = await getAllAccountRequests(offset, limit);

    res.send({
        total,
        data: accRequests.map((accRequest) => ({
            id: accRequest.id,
            firstName: accRequest.firstName,
            lastName: accRequest.lastName,
            email: accRequest.email,
            company: accRequest.company,
            description: accRequest.description,
            status: accRequest.status,
        })),
    });
}));

/**
 * @swagger
 * /accountRequests:
 *   post:
 *     tags:
 *       - Account Request
 *     summary: Create an Account Request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 description: First name
 *                 type: string
 *               lastName:
 *                 description: Last name
 *                 type: string
 *               email:
 *                 description: E-mail
 *                 type: string
 *               company:
 *                 description: Company
 *                 type: string
 *               description:
 *                 description: Description
 *                 type: string
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountRequest'
 *             example:
 *               id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *               firstName: Ali
 *               lastName: Yousuf
 *               email: ali.yousuf@tenpearls.com
 *               company: 10Pearls
 *               description: Some description
 *               status: UNDECIDED
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/accountRequests', wrapAsync(async (req: Request, res: express.Response) => {
    const { firstName, lastName, email, company, description } = await Joi
        .object({
            firstName: Joi.string().trim().min(1).max(50).required().label('First name'),
            lastName: Joi.string().trim().min(1).max(50).required().label('Last name'),
            email: Joi.string().trim().lowercase().email().required().label('Email'),
            company: Joi.string().trim().min(1).max(50).required().label('Company'),
            description: Joi.string().trim().min(3).max(2048).required().label('Description'),
        })
        .validateAsync(req.body);

    const accRequest = await createAccountRequest(firstName, lastName, email, company, description);

    res.send({
        id: accRequest.id,
        firstName: accRequest.firstName,
        lastName: accRequest.lastName,
        email: accRequest.email,
        company: accRequest.company,
        description: accRequest.description,
        status: accRequest.status,
    });
}));

/**
 * @swagger
 * /accountRequests/{accRequestId}:
 *   put:
 *     tags:
 *       - Account Request
 *     summary: Approve/Reject Account Request
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/accRequestId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 description: Account Request Status
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountRequest'
 *             example:
 *               id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *               firstName: Ali
 *               lastName: Yousuf
 *               email: ali.yousuf@tenpearls.com
 *               company: 10Pearls
 *               description: Some description
 *               status: APPROVED
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/accountRequests/:accRequestId', authorize([Role.ADMIN]), wrapAsync(async (req: Request, res: express.Response) => {
    const { accRequestId, status } = await Joi
        .object({
            accRequestId: Joi.string().trim().uuid().required().label('Account Request ID'),
            status: Joi.string().valid(AccountRequestStatus.APPROVED, AccountRequestStatus.REJECTED).required().label('Status'),
        })
        .validateAsync({
            ...req.body,
            accRequestId: req.params.accRequestId,
        });

    let accRequest;
    if (status === AccountRequestStatus.APPROVED) {
        accRequest = await approveAccountRequest(accRequestId);
    } else {
        accRequest = await rejectAccountRequest(accRequestId);
    }

    res.send({
        id: accRequest.id,
        firstName: accRequest.firstName,
        lastName: accRequest.lastName,
        email: accRequest.email,
        company: accRequest.company,
        description: accRequest.description,
        status: accRequest.status,
    });
}));

export default router;
