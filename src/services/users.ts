import Boom from '@hapi/boom';
import bcrypt from 'bcrypt';
import mailer from './mailer';

import config from '../config';
import { VendorUser } from '../models/VendorUser';
import { Role, VendorRole } from '../models/enums';
import { User } from '../models/User';
import VendorRepo from '../repositories/vendors';
import VendorSettingsRepo from '../repositories/vendorSettings';
import UserRepo from '../repositories/users';
import { EmailTemplate } from '../utils/emailTemplater';

import { generateInvitationToken } from './invitationToken';
import { generateResetPasswordToken } from './resetPasswordToken';

export async function getAllAdminUsers(invitationAccepted: boolean | 'all', offset: number, limit: number): Promise<[User[], number]> {
    return UserRepo.getAll([Role.ADMIN], invitationAccepted, offset, limit);
}

export async function getAllVendorUsers(vendorId: string, invitationAccepted: boolean | 'all', offset: number, limit: number): Promise<[User[], number]> {
    return UserRepo.getAllByVendorId(vendorId, invitationAccepted, offset, limit);
}

export async function getUserVendors(userId: string): Promise<VendorUser[]> {
    return UserRepo.getUserVendors(userId);
}

export async function findUserByID(userId: string): Promise<User> {
    const user = await UserRepo.findById(userId);
    if (!user) {
        throw Boom.notFound('User with this id does not exist');
    }

    return user;
}

export async function findUserByEmail(email: string): Promise<User> {
    const user = await UserRepo.findByEmail(email);
    if (!user) {
        throw Boom.notFound('User with this email does not exist');
    }

    return user;
}

export async function findVendorUser(vendorId: string, userId: string): Promise<VendorUser> {
    const vendorUser = await UserRepo.findVendorUser(vendorId, userId);
    if (!vendorUser) {
        throw Boom.notFound('User does not exist in the vendor');
    }

    return vendorUser;
}

export async function createUser(email: string, role: Role): Promise<User> {
    const user = await findUserByEmail(email).catch(() => null);
    if (user) {
        throw Boom.conflict('User with this email already exist');
    }

    return UserRepo.create(email, role);
}

export async function sendUserInvitation(userId: string, invitee: User): Promise<void> {
    const user = await findUserByID(userId);
    if (!user) {
        throw Boom.notFound('User with this id does not exist');
    }
console.log('user is ', user)
    if (user.invitationAccepted) {
        throw Boom.conflict('User has already accepted the invitation');
    }

    const token = await generateInvitationToken(user);
    const invitationURL = `${config.app.url}/accept-invitation?token=${encodeURIComponent(token)}`;

    await mailer.sendMail(config.transactionalEmailSource, {
        address: user.email,
        templateData: {
            user,
        },
    }, EmailTemplate.USER_INVITATION, {
        invitationURL,
        invitee,
    });
}

export async function updateUser(userId: string, user: Partial<Pick<User, 'firstName' | 'lastName' | 'hashedPassword' | 'invitationAccepted'>>): Promise<User> {
    return UserRepo.update(userId, user);
}

export async function updateUserPassword(userId: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 8);

    return updateUser(userId, { hashedPassword });
}

export async function requestPasswordReset(user: User): Promise<void> {
    const token = generateResetPasswordToken(user);
    const resetPasswordURL = `${config.app.url}/reset-password?token=${encodeURIComponent(token)}`;

    // await mailer.sendMail(config.transactionalEmailSource, {
    //     address: user.email,
    //     templateData: {
    //         user,
    //     },
    // }, EmailTemplate.RESET_PASSWORD, {
    //     resetPasswordURL,
    // });
}

export async function deleteUser(userId: string): Promise<void> {
    await UserRepo.remove(userId);
}

export async function addUserToVendor(vendorId: string, userId: string, vendorRole: VendorRole): Promise<VendorUser> {
    const vendorUser = await UserRepo.findVendorUser(vendorId, userId);
    if (vendorUser) {
        throw Boom.conflict('User already exist in the vendor');
    }

    return UserRepo.upsertToVendor(vendorId, userId, { role: vendorRole });
}

export async function sendVendorInvitation(vendorId: string, userId: string, invitee: User): Promise<void> {
    const user = await findUserByID(userId);
    if (!user) {
        throw Boom.notFound('User with this id does not exist');
    }

    const vendorUser = await findVendorUser(vendorId, userId);
    if (vendorUser.invitationAccepted) {
        throw Boom.conflict('User has already accepted the invitation');
    }

    const vendor = await VendorRepo.find(vendorId);

    const token = await generateInvitationToken(user);
    const invitationURL = `${config.app.url}/accept-invitation?token=${encodeURIComponent(token)}`;

    await mailer.sendMail(config.transactionalEmailSource, {
        address: user.email,
        templateData: {
            user: {
                ...user,
                role: vendorUser.role,
            },
        },
    }, EmailTemplate.VENDOR_INVITATION, {
        invitationURL,
        invitee,
        vendor: vendor,
    });
}

export async function updateVendorUser(vendorId: string, userId: string, vendorRole: VendorRole): Promise<VendorUser> {
    const vendorUser = await findVendorUser(vendorId, userId);
    if (!vendorUser.invitationAccepted) {
        throw Boom.conflict('Not allowed to change role until user accepts the invitation');
    }

    return UserRepo.upsertToVendor(vendorId, userId, { role: vendorRole });
}

export async function acceptVendorInvitation(vendorId: string, userId: string): Promise<void> {
    const vendortUser = await findVendorUser(vendorId, userId);
    if (vendortUser.invitationAccepted) {
        throw Boom.conflict('User has already accepted the invitation');
    }

    await UserRepo.upsertToVendor(vendorId, userId, { invitationAccepted: true });
}

export async function removeUserFromVendor(vendorId: string, userId: string): Promise<void> {
    const vendorUser = await findVendorUser(vendorId, userId);

    await UserRepo.removeFromVendor(vendorUser);

    // await updateClientLimitExceededState(clientId);
}

export function checkVendorUserRole(allowedRoles: VendorRole | VendorRole[], vendorUsers: VendorUser[], vendorId: string, userId: string): boolean {
    if (!Array.isArray(allowedRoles)) {
        if (allowedRoles) {
            allowedRoles = [allowedRoles];
        } else {
            allowedRoles = [];
        }
    }

    const filteredVendorUsers = vendorUsers.filter((vendorUser) => {
        return vendorUser.vendorId === vendorId &&
               vendorUser.userId === userId &&
               allowedRoles.includes(vendorUser.role);
    });

    const hasAccess = filteredVendorUsers.length > 0;

    return hasAccess;
}

export async function checkVendorUserLimit(vendorId: string): Promise<void> {
    const settings = await VendorSettingsRepo.find(vendorId);
    if (!settings) {
        throw new Error('Vendor settings not found');
    }

    const { userLimit } = settings;
    const [, totalUsers] = await UserRepo.getAllByVendorId(vendorId, 'all', 0, 0);

    if (totalUsers >= userLimit) {
        throw Boom.paymentRequired('You cannot add more users because your limit has been reached');
    }
}
