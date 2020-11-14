import express, { Router } from 'express';

import { wrapAsync } from '../utils/asyncHandler';

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     tags:
 *       - Default
 *     summary: Health check
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *             example:
 *               message: Hello World
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', wrapAsync(async (req: express.Request, res: express.Response) => {
    res.send({ message: 'Hello World', build: process.env.BUILD });
}));

export default router;
