import bcrypt from 'bcrypt';

import { User } from '../models/User';

import { InvitationClaims, ClaimType } from './claims';

export async function generateInvitationToken(user: User): Promise<string> {
    const claims: InvitationClaims = {
        type: ClaimType.INVITATION,
        userId: user.id,
        role: user.role,
    };

    const token = await bcrypt.hash(JSON.stringify(claims), 8);

    return `${claims.type}:${user.email}:${token}`;
}
