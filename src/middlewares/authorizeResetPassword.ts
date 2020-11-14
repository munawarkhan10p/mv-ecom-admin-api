import express from 'express';

import { Request } from '../routes/interfaces';
import { verifyResetPasswordToken } from '../services/resetPasswordToken';
import { findUserByEmail } from '../services/users';

export function authorizeResetPassword(): express.RequestHandler {
    return async (req: Request, res: express.Response, next: express.NextFunction): Promise<void> => {
        try {
            const token = req.query.token as string;

            const { email } = await verifyResetPasswordToken(token);

            const user = await findUserByEmail(email);

            req.user = user;

            return next();
        } catch (err) {
            next(err);
        }
    };
}
