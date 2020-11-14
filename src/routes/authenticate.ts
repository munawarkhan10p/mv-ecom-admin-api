import Boom from '@hapi/boom';
import Joi from '@hapi/joi';
import express, { Router } from 'express';

import { generateAuthToken } from '../services/authToken';
import { findUserByEmail } from '../services/users';
import { wrapAsync } from '../utils/asyncHandler';

const router = Router();

/**
 * @swagger
 * /users/authenticate:
 *   post:
 *     tags:
 *       - Authenticate
 *     summary: Generate token for authentication
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 description: E-mail
 *                 type: string
 *                 minimum: 3
 *                 maximum: 255
 *               password:
 *                 description: Password
 *                 type: string
 *                 minimum: 3
 *                 maximum: 255
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Authenticate'
 *             example:
 *               token: base64-token
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/users/authenticate', wrapAsync(async (req: express.Request, res: express.Response) => {
    const { email, password } = await Joi
        .object({
            email: Joi.string().trim().lowercase().email().required().label('Email'),
            password: Joi.string().required().label('Password'),
        })
        .validateAsync({
            email: req.body.email,
            password: req.body.password,
        });

    try {
        const user = await findUserByEmail(email);
        console.log(user);
        const token = await generateAuthToken(user, password);

        res.send({ token });
    } catch (err) {
        req.log.error({ err });

        throw Boom.unauthorized('Email and/or password did not match');
    }
}));

export default router;
