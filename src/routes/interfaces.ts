import * as express from 'express';

import { VendorUser } from '../models/VendorUser';
import { Role } from '../models/enums';
import { User } from '../models/User';

export interface UserRequest extends express.Request {
    user: User;
}

export interface VendorUserRequest extends UserRequest {
    vendorUsers: VendorUser[];
}

export type Request = express.Request | UserRequest | VendorUserRequest;

export function isUserReq(req: Request): req is UserRequest {
    return (req as UserRequest).user !== undefined;
}

export function isVendorUserReq(req: Request): req is VendorUserRequest {
    return isUserReq(req) && (req as VendorUserRequest).user.role === Role.VENDOR;
}
