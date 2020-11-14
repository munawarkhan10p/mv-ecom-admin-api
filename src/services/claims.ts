import { Role } from '../models/enums';

export enum ClaimType {
    AUTH = 'auth',
    INVITATION = 'invitation',
}

export interface AuthClaims {
    type: ClaimType;
    userId: string;
    role: Role;
}

export interface InvitationClaims {
    type: ClaimType;
    userId: string;
    role: Role;
}

export interface ResetPasswordClaims {
    email: string;
    expiry: Date;
}
