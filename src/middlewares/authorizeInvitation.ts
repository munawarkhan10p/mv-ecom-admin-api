import Boom from '@hapi/boom';
import bcrypt from 'bcrypt';
import express from 'express';

import { Request } from '../routes/interfaces';
import { InvitationClaims, ClaimType } from '../services/claims';
import { findUserByEmail } from '../services/users';

export function authorizeInvitation(): express.RequestHandler {
    return async (req: Request, res: express.Response, next: express.NextFunction): Promise<void> => {
        try {
            const token = req.query.token;
            if (typeof token !== 'string') {
                throw Boom.unauthorized('Token is not valid');
            }

            const parts = token.split(':');
            if (parts.length !== 3) {
                throw Boom.unauthorized('Token is not valid');
            }

            const [, email, hash] = parts;

            const user = await findUserByEmail(email);
            if (user.invitationAccepted) {
                throw Boom.conflict('Invitation already accepted');
            }

            const claims: InvitationClaims = {
                type: ClaimType.INVITATION,
                userId: user.id,
                role: user.role,
            };

            if (!await bcrypt.compare(JSON.stringify(claims), hash)) {
                throw Boom.unauthorized('Token is not valid');
            }

            req.user = user;

            return next();
        } catch (err) {
            next(err);
        }
    };
}
