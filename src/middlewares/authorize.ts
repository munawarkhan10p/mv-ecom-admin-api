import Boom from '@hapi/boom';
import express from 'express';

import { VendorRole, Role, VendorState } from '../models/enums';
import { Request } from '../routes/interfaces';
import { verifyAuthToken } from '../services/authToken';
import { findVendor } from '../services/vendors';
import { findUserByID, getUserVendors, checkVendorUserRole, findVendorUser } from '../services/users';

export function authorize(roles?: Role | Role[], clientRoles?: VendorRole | VendorRole[], allowPendingClientInvitation = false): express.RequestHandler {
    if (!Array.isArray(roles)) {
        if (roles) {
            roles = [roles];
        } else {
            roles = [];
        }
    }

    if (!Array.isArray(clientRoles)) {
        if (clientRoles) {
            clientRoles = [clientRoles];
        } else {
            clientRoles = [];
        }
    }

    // cannot have client roles when role does not include client
    if (!roles.includes(Role.VENDOR) && clientRoles.length > 0) {
        throw new Error('Cannot perform authorization of clientRoles when roles does not include "client"');
    }

    return async (req: Request, res: express.Response, next: express.NextFunction): Promise<void> => {
        if (!Array.isArray(roles)) {
            if (roles) {
                roles = [roles];
            } else {
                roles = [];
            }
        }

        if (!Array.isArray(clientRoles)) {
            if (clientRoles) {
                clientRoles = [clientRoles];
            } else {
                clientRoles = [];
            }
        }

        // token verification
        let token: string | null = null;
        const authheader = (req.headers.authorization || '').split(' ');
        if (authheader.length === 2 && authheader[0].toLowerCase() === 'bearer') {
            token = authheader[1];
        }

        if (!token) {
            return next(Boom.unauthorized('Token required'));
        }

        try {
            const claims = verifyAuthToken(token);

            const user = await findUserByID(claims.userId);

            if (!user.invitationAccepted) {
                return next(Boom.forbidden('Invitation not accepted yet'));
            }

            if (!allowPendingClientInvitation && user.role === Role.VENDOR && req.params.clientId) {
                const clientUser = await findVendorUser(req.params.clientId, user.id);
                if (!clientUser.invitationAccepted) {
                    return next(Boom.forbidden('Invitation not accepted yet'));
                }
            }

            req.user = user;
        } catch (err) {
            req.log.error({ err });

            return next(Boom.unauthorized('This token is unauthorized'));
        }

        // role checking
        if (roles.length === 0) {
            return next();
        }

        if (!roles.includes(req.user.role)) {
            return next(Boom.forbidden());
        }

        if (req.user.role !== Role.VENDOR) {
            return next();
        }

        // client role checking
        req.vendorUsers = await getUserVendors(req.user.id);

        if (clientRoles.length === 0) {
            return next();
        }

        const hasAccess = checkVendorUserRole(clientRoles, req.vendorUsers, req.params.clientId, req.user.id);
        if (!hasAccess) {
            return next(Boom.forbidden('You are not allowed to access this resource'));
        }

        return next();
    };
}

export function ensureClientState(states: VendorState | VendorState[] = [VendorState.NORMAL]): express.RequestHandler {
    return async (req: Request, res: express.Response, next: express.NextFunction): Promise<void> => {
        if (!Array.isArray(states)) {
            if (states) {
                states = [states];
            } else {
                states = [];
            }
        }

        if (!req.params.clientId) {
            throw new Error('Wrong middleware placement?');
        }

        const client = await findVendor(req.params.clientId);
        if (!states.includes(client.state)) {
            return next(Boom.forbidden('Your plan status does not allow this action'));
        }

        return next();
    };
}
