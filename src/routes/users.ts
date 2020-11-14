import Boom from '@hapi/boom';
import Joi from '@hapi/joi';
import bcrypt from 'bcrypt';
import express, { Router } from 'express';

import { authorize, ensureClientState } from '../middlewares/authorize';
import { authorizeInvitation } from '../middlewares/authorizeInvitation';
import { authorizeResetPassword } from '../middlewares/authorizeResetPassword';
import { Role, VendorRole } from '../models/enums';
import { User } from '../models/User';
import { findVendor } from '../services/vendors';
import { removeUserFromVendor, getAllAdminUsers, getAllVendorUsers, createUser, findUserByID, checkVendorUserLimit, updateVendorUser, addUserToVendor, deleteUser, sendUserInvitation, findUserByEmail, sendVendorInvitation, updateUser, updateUserPassword, acceptVendorInvitation, requestPasswordReset } from '../services/users';
import { wrapAsync } from '../utils/asyncHandler';

import { Request, isUserReq } from './interfaces';

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - User
 *     summary: Get Super Admin User list
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
 *                   type: arraySuper
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *             example:
 *               total: 2
 *               data:
 *                 - id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *                   email: admin@dtech.com
 *                   firstName: Max
 *                   lastName: well
 *                   role: ADMIN
 *                   invitationAccepted: true
 *                 - id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *                   email: admin2@dtech.com
 *                   firstName: Hima
 *                   lastName: joe
 *                   role: ADMIN
 *                   invitationAccepted: false
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/users', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { limit, offset } = await Joi
        .object({
            offset: Joi.number().integer().default(0).failover(0).label('Offset'),
            limit: Joi.number().integer().default(10).failover(10).label('Limit'),
        })
        .validateAsync({
            offset: req.query.offset,
            limit: req.query.limit,
        });

    const [users, total] = await getAllAdminUsers('all', offset, limit);

    res.send({
        total,
        data: users.map((user) => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            invitationAccepted: user.invitationAccepted,
        })),
    });
}));

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags:
 *       - User
 *     summary: Get Current User
 *     security:
 *       - JWT: []
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             example:
 *               id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *               email: admin@dtech.com
 *               firstName: John
 *               lastName: Doe
 *               role: ADMIN
 *               invitationAccepted: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/users/me', authorize(), wrapAsync(async (req: Request, res: express.Response) => {
    if (!isUserReq(req)) {
        throw new Error('User not found in session');
    }

    res.send({
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        invitationAccepted: req.user.invitationAccepted,
    });
}));

/**
 * @swagger
 * /users/me:
 *   put:
 *     tags:
 *       - User
 *     summary: Edit current user profile
 *     security:
 *       - JWT: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               firstName:
 *                  description: First name
 *                  type: string
 *                  minimum: 1
 *                  maximum: 50
 *               lastName:
 *                  description: Last name
 *                  type: string
 *                  minimum: 1
 *                  maximum: 50
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             example:
 *               id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *               email: admin@dtech.com
 *               firstName: John
 *               lastName: Doe
 *               role: ADMIN
 *               invitationAccepted: true
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/users/me', authorize(), wrapAsync(async (req: Request, res: express.Response) => {
    if (!isUserReq(req)) {
        throw new Error('User not found in session');
    }

    const user = await Joi
        .object({
            firstName: Joi.string().trim().min(1).max(50).required().label('First name'),
            lastName: Joi.string().trim().min(1).max(50).required().label('Last name'),
        })
        .validateAsync(req.body);

    const _user = await updateUser(req.user.id, user);

    res.send({
        id: _user.id,
        email: req.user.email,
        firstName: _user.firstName,
        lastName: _user.lastName,
        role: req.user.role,
        invitationAccepted: req.user.invitationAccepted,
    });
}));

/**
 * @swagger
 * /users/me/password:
 *   put:
 *     tags:
 *       - User
 *     summary: Change current user password
 *     security:
 *       - JWT: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               currentPassword:
 *                  description: Current password
 *                  type: string
 *               password:
 *                  description: Password
 *                  type: string
 *                  minimum: 3
 *                  maximum: 50
 *     produces:
 *       - application/json
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContentResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/users/me/password', authorize(), wrapAsync(async (req: Request, res: express.Response) => {
    if (!isUserReq(req)) {
        throw new Error('User not found in session');
    }

    const { currentPassword, password } = await Joi
        .object({
            currentPassword: Joi.string().required().label('Current Password'),
            password: Joi.string().min(3).max(50).required().label('Password'),
        })
        .validateAsync(req.body);

    if (!req.user.hashedPassword) {
        throw new Error('Password is missing');
    }

    if (!await bcrypt.compare(currentPassword, req.user.hashedPassword)) {
        throw Boom.badRequest('Current password is incorrect');
    }

    await updateUserPassword(req.user.id, password);

    res.status(204).send();
}));

/**
 * @swagger
 * /users:
 *   post:
 *     tags:
 *       - User
 *     summary: Invite Super Admin User
 *     security:
 *       - JWT: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *            schema:
 *              type: object
 *              properties:
 *                email:
 *                  description: User e-mail
 *                  type: string
 *                  minimum: 3
 *                  maximum: 255
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserInvitation'
 *             example:
 *               id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *               email: max@client.com
 *               role: CLIENT
 *               invitationAccepted: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/users', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    if (!isUserReq(req)) {
        throw new Error('User not found in session');
    }

    const { email } = await Joi
        .object({
            email: Joi.string().trim().lowercase().email().required().label('Email'),
        })
        .validateAsync(req.body);

    const user = await createUser(email, Role.ADMIN);

    await sendUserInvitation(user.id, req.user);

    res.send({
        id: user.id,
        email: user.email,
        role: user.role,
        invitationAccepted: user.invitationAccepted,
    });
}));

/**
 * @swagger
 * /users/{userId}/resend-invitation:
 *   post:
 *     tags:
 *       - User
 *     summary: Resend invitation to Super Admin User
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
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
router.post('/users/:userId/resend-invitation', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    if (!isUserReq(req)) {
        throw new Error('User not found in session');
    }

    const { userId } = await Joi
        .object({
            userId: Joi.string().uuid().required().label('User ID'),
        })
        .validateAsync({
            userId: req.params.userId,
        });

    const user = await findUserByID(userId);

    await sendUserInvitation(user.id, req.user);

    res.status(204).send();
}));

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     tags:
 *       - User
 *     summary: Delete a User
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
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
router.delete('/users/:userId', authorize(Role.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { userId } = await Joi
        .object({
            userId: Joi.string().uuid().required().label('User ID'),
        })
        .validateAsync({
            userId: req.params.userId,
        });

    await findUserByID(userId);

    await deleteUser(userId);

    res.status(204).send();
}));

/**
 * @swagger
 * /users/invitation:
 *   get:
 *     tags:
 *       - User
 *     summary: Get User Invitation details
 *     parameters:
 *       - $ref: '#/components/parameters/invitationToken'
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserInvitation'
 *             example:
 *               id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *               email: user@client.com
 *               role: CLIENT
 *               invitationAccepted: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/users/invitation', authorizeInvitation(), wrapAsync(async (req: Request, res: express.Response) => {
    if (!isUserReq(req)) {
        throw new Error('User not found in session');
    }

    res.send({
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        invitationAccepted: req.user.invitationAccepted,
    });
}));

/**
 * @swagger
 * /users/accept-invitation:
 *   post:
 *     tags:
 *       - User
 *     summary: Accept user invitation
 *     parameters:
 *       - $ref: '#/components/parameters/invitationToken'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               firstName:
 *                  description: First name
 *                  type: string
 *                  minimum: 1
 *                  maximum: 50
 *               lastName:
 *                  description: Last name
 *                  type: string
 *                  minimum: 1
 *                  maximum: 50
 *               password:
 *                  description: Password
 *                  type: string
 *                  minimum: 3
 *                  maximum: 50
 *     produces:
 *       - application/json
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContentResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/users/accept-invitation', authorizeInvitation(), wrapAsync(async (req: Request, res: express.Response) => {
    if (!isUserReq(req)) {
        throw new Error('User not found in session');
    }
    console.log('inside accept invitation');

    const user = await Joi
        .object({
            firstName: Joi.string().trim().min(1).max(50).required().label('First name'),
            lastName: Joi.string().trim().min(1).max(50).required().label('Last name'),
            password: Joi.string().min(3).max(50).required().label('Password'),
        })
        .validateAsync(req.body);

    await updateUser(req.user.id, { ...user, invitationAccepted: true });

    await updateUserPassword(req.user.id, user.password);

    res.status(204).send();
}));

/**
 * @swagger
 * /users/request-password-reset:
 *   post:
 *     tags:
 *       - User
 *     summary: Request user password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 description: User e-mail
 *                 type: string
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
router.post('/users/request-password-reset', wrapAsync(async (req: Request, res: express.Response) => {
    const { email } = await Joi
        .object({
            email: Joi.string().trim().lowercase().email().required().label('Email'),
        })
        .validateAsync(req.body);

    const user = await findUserByEmail(email);

    await requestPasswordReset(user);

    res.send(204);
}));

/**
 * @swagger
 * /users/reset-password:
 *   post:
 *     tags:
 *       - User
 *     summary: Reset user password
 *     parameters:
 *       - $ref: '#/components/parameters/resetPasswordToken'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               password:
 *                  description: Password
 *                  type: string
 *                  minimum: 3
 *                  maximum: 50
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
router.post('/users/reset-password', authorizeResetPassword(), wrapAsync(async (req: Request, res: express.Response) => {
    if (!isUserReq(req)) {
        throw new Error('User not found in session');
    }

    const { password } = await Joi
        .object({
            password: Joi.string().min(3).max(50).required().label('Password'),
        })
        .validateAsync({
            ...req.body,
        });

    await updateUserPassword(req.user.id, password);

    res.send(204);
}));

/**
 * @swagger
 * /clients/{clientId}/users:
 *   get:
 *     tags:
 *       - User
 *     summary: Get Client User list
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/clientId'
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
 *                 limit:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ClientUser'
 *             example:
 *               total: 2
 *               limit: 10
 *               data:
 *                - id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *                  email: user@client.com
 *                  firstName: John
 *                  lastName: Doe
 *                  role: CLIENT
 *                  clientRole: MANAGER
 *                  invitationAccepted: true
 *                - id: 5c5a9767-aeb0-439e-a42e-48f0308468b4
 *                  email: user@analyst.com
 *                  firstName: John
 *                  lastName: Doe
 *                  role: CLIENT
 *                  clientRole: ANALYST
 *                  invitationAccepted: false
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/clients/:clientId/users', authorize([Role.ADMIN, Role.VENDOR], VendorRole.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { clientId, offset, limit } = await Joi
        .object({
            clientId: Joi.string().uuid().required().label('Client ID'),
            offset: Joi.number().integer().default(0).failover(0).label('Offset'),
            limit: Joi.number().integer().default(10).failover(10).label('Limit'),
        })
        .validateAsync({
            clientId: req.params.clientId,
            offset: req.query.offset,
            limit: req.query.limit,
        });

    const client = await findVendor(clientId);
    const [users, total] = await getAllVendorUsers(clientId, 'all', offset, limit);

    res.send({
        total,
        limit: client.settings.userLimit,
        data: users.map((user) => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            clientRole: user.vendorUsers[0].role,
            invitationAccepted: user.vendorUsers[0].invitationAccepted,
        })),
    });
}));

/**
 * @swagger
 * /clients/{clientId}/users:
 *   post:
 *     tags:
 *       - User
 *     summary: Invite User to Client
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/clientId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *            schema:
 *              type: object
 *              properties:
 *                email:
 *                  description: User e-mail
 *                  type: string
 *                  minimum: 3
 *                  maximum: 255
 *                clientRole:
 *                  description: Client role
 *                  type: string
 *                  enum: [ADMIN, ANALYST, VETTER]
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientUser'
 *             example:
 *               id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *               email: user@client.com
 *               firstName: John
 *               lastName: Doe
 *               role: CLIENT
 *               clientRole: MANAGER
 *               invitationAccepted: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       402:
 *         $ref: '#/components/responses/PaymentRequired'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/clients/:clientId/users', authorize([Role.ADMIN, Role.VENDOR], VendorRole.ADMIN), ensureClientState(), wrapAsync(async (req: Request, res: express.Response) => {
    if (!isUserReq(req)) {
        throw new Error('User not found in session');
    }

    const { clientId, email, clientRole } = await Joi
        .object({
            clientId: Joi.string().uuid().required().label('Client ID'),
            email: Joi.string().trim().lowercase().email().required().label('Email'),
            clientRole: Joi.string().valid(...Object.values(VendorRole)).required().label('Client role'),
        })
        .validateAsync({
            ...req.body,
            clientId: req.params.clientId,
        });

    await checkVendorUserLimit(clientId);

    let user: User | null = null;

    try {
        user = await createUser(email, Role.VENDOR);
    } catch (err) { // usually throws when user already exists
        user = await findUserByEmail(email);

        if (!user) { // if it still cannot find the user, lets throw the error
            throw err;
        }
    }

    const clientUser = await addUserToVendor(clientId, user.id, clientRole);

    await sendVendorInvitation(clientId, user.id, req.user);

    res.send({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clientRole: clientUser.role,
        invitationAccepted: user.invitationAccepted,
    });
}));

/**
 * @swagger
 * /clients/{clientId}/users/{userId}/resend-invitation:
 *   post:
 *     tags:
 *       - User
 *     summary: Resend invitation to Client User
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/clientId'
 *       - $ref: '#/components/parameters/userId'
 *     produces:
 *       - application/json
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContentResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/clients/:clientId/users/:userId/resend-invitation', authorize([Role.ADMIN, Role.VENDOR]), ensureClientState(), wrapAsync(async (req: Request, res: express.Response) => {
    if (!isUserReq(req)) {
        throw new Error('User not found in session');
    }

    const { clientId, userId } = await Joi
        .object({
            clientId: Joi.string().uuid().required().label('Client ID'),
            userId: Joi.string().uuid().required().label('User ID'),
        })
        .validateAsync({
            clientId: req.params.clientId,
            userId: req.params.userId,
        });

    await sendVendorInvitation(clientId, userId, req.user);

    res.status(204).send();
}));

/**
 * @swagger
 * /clients/{clientId}/accept-invitation:
 *   post:
 *     tags:
 *       - User
 *     summary: Accept client invitation
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/clientId'
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
router.post('/clients/:clientId/accept-invitation', authorize(Role.VENDOR, [], true), wrapAsync(async (req: Request, res: express.Response) => {
    if (!isUserReq(req)) {
        throw new Error('User not found in session');
    }

    const { clientId } = await Joi
        .object({
            clientId: Joi.string().trim().uuid().required().label('Client ID'),
        })
        .validateAsync({
            clientId: req.params.clientId,
        });

    await acceptVendorInvitation(clientId, req.user.id);

    res.status(204).send();
}));

/**
 * @swagger
 * /clients/{clientId}/users/{userId}:
 *   put:
 *     tags:
 *       - User
 *     summary: Update Client User
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/clientId'
 *       - $ref: '#/components/parameters/userId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *            schema:
 *              type: object
 *              properties:
 *                clientRole:
 *                  description: Client role
 *                  type: string
 *                  enum: [ADMIN, ANALYST, VETTER]
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientUser'
 *             example:
 *               id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *               email: user@client.com
 *               firstName: John
 *               lastName: Doe
 *               role: CLIENT
 *               clientRole: MANAGER
 *               invitationAccepted: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/clients/:clientId/users/:userId', authorize([Role.ADMIN, Role.VENDOR], VendorRole.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { clientId, userId, clientRole } = await Joi
        .object({
            clientId: Joi.string().uuid().required().label('Client ID'),
            userId: Joi.string().uuid().required().label('User ID'),
            clientRole: Joi.string().valid(...Object.values(VendorRole)).required().label('Client role'),
        })
        .validateAsync({
            ...req.body,
            clientId: req.params.clientId,
            userId: req.params.userId,
        });

    const user = await findUserByID(userId);
    const clientUser = await updateVendorUser(clientId, userId, clientRole);

    res.send({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clientRole: clientUser.role,
        invitationAccepted: clientUser.invitationAccepted,
    });
}));

/**
 * @swagger
 * /clients/{clientId}/users/{userId}:
 *   delete:
 *     tags:
 *       - User
 *     summary: Remove User from Client
 *     security:
 *       - JWT: []
 *     parameters:
 *       - $ref: '#/components/parameters/clientId'
 *       - $ref: '#/components/parameters/userId'
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
router.delete('/clients/:clientId/users/:userId', authorize([Role.ADMIN, Role.VENDOR], VendorRole.ADMIN), wrapAsync(async (req: Request, res: express.Response) => {
    const { clientId, userId } = await Joi
        .object({
            clientId: Joi.string().uuid().required().label('Client ID'),
            userId: Joi.string().uuid().required().label('User ID'),
        })
        .validateAsync({
            clientId: req.params.clientId,
            userId: req.params.userId,
        });

    await removeUserFromVendor(clientId, userId);

    res.status(204).send();
}));

export default router;
