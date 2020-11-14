import bcrypt from 'bcrypt';
import JWT from 'jsonwebtoken';

import config from '../config';
import { User } from '../models/User';

import { AuthClaims, ClaimType } from './claims';

export async function generateAuthToken(user: User, password: string): Promise<string> {
    if (!user.hashedPassword) {
        throw new Error('Password is missing');
    }

    if (!await bcrypt.compare(password, user.hashedPassword)) {
        throw new Error('Password did not match');
    }

    const claims: AuthClaims = {
        type: ClaimType.AUTH,
        userId: user.id,
        role: user.role,
    };

    return JWT.sign(claims, config.token.auth.secret, {
        expiresIn: config.token.auth.expiry,
    });
}

export function verifyAuthToken(token: string): AuthClaims {
    const claims = JWT.verify(token, config.token.auth.secret) as AuthClaims;

    if (claims.type !== ClaimType.AUTH) {
        throw new Error('Token type is not valid');
    }

    return claims;
}
