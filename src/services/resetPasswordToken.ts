import crypto from 'crypto';

import Boom from '@hapi/boom';
import ms from 'ms';

import config from '../config';
import { User } from '../models/User';

import { ResetPasswordClaims } from './claims';

export function generateResetPasswordToken(user: User): string {
    const expiryMs = new Date().getTime() + ms(config.token.resetPassword.expiry);
    const claim = {
        email: user.email,
        expiry: new Date(expiryMs),
    };

    const signature = crypto.createHmac('sha256', config.token.resetPassword.secret).update(JSON.stringify(claim)).digest('hex');

    return `${user.email}:${expiryMs}:${signature}`;
}

export async function verifyResetPasswordToken(token: string): Promise<ResetPasswordClaims> {
    if (typeof token !== 'string') {
        throw Boom.unauthorized('Token is not valid');
    }

    const parts = token.split(':');
    if (parts.length !== 3) {
        throw Boom.unauthorized('Token is not valid');
    }

    const [email, expiryMs, signature] = parts;
    const expiryDate = new Date(parseInt(expiryMs));

    if (expiryDate < new Date()) {
        throw Boom.unauthorized('Token is not valid');
    }

    const claim = {
        email,
        expiry: expiryDate,
    };

    const verificationSignature = crypto.createHmac('sha256', config.token.resetPassword.secret).update(JSON.stringify(claim)).digest('hex');

    if (verificationSignature !== signature) {
        throw Boom.unauthorized('Token is not valid');
    }

    return claim;
}
