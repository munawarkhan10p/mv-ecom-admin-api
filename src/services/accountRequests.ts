import Boom from '@hapi/boom';

import config from '../config';
import { AccountRequest } from '../models/AccountRequest';
import { AccountRequestStatus, Role, VendorRole, VendorType } from '../models/enums';
import { User } from '../models/User';
import AccountRequestRepo from '../repositories/accountRequests';
import { EmailTemplate } from '../utils/emailTemplater';

import { createVendor, deleteVendor, findVendor } from './vendors';
import { generateInvitationToken } from './invitationToken';
import mailer from './mailer';
import { getAllAdminUsers, findUserByID, findUserByEmail, createUser, addUserToVendor } from './users';

export async function getAllAccountRequests(offset: number, limit: number): Promise<[AccountRequest[], number]> {
    return AccountRequestRepo.getAll(AccountRequestStatus.UNDECIDED, offset, limit);
}

export async function findAccountRequest(accRequestId: string): Promise<AccountRequest> {
    const accRequest = await AccountRequestRepo.find(accRequestId);
    if (!accRequest) {
        throw Boom.notFound('Account Request with this id does not exist');
    }

    return accRequest;
}

async function sendAccountRequestAdminEmail(users: User[], accRequest: AccountRequest): Promise<void> {
    const mails = users.map(user => {
        return mailer.sendMail(config.transactionalEmailSource, {
            address: user.email,
            templateData: {
                user,
            },
        }, EmailTemplate.ACCOUNT_REQUEST_ADMIN, {
            accRequest,
        });
    });

    await Promise.all(mails);
}

async function sendAccountRequestUserEmail(accRequest: AccountRequest): Promise<void> {
    await mailer.sendMail(config.transactionalEmailSource, {
        address: accRequest.email,
        templateData: {},
    }, EmailTemplate.ACCOUNT_REQUEST_USER, {
        accRequest,
    });
}

async function sendAccountRequestRejectionEmail(accRequest: AccountRequest): Promise<void> {
    await mailer.sendMail(config.transactionalEmailSource, {
        address: accRequest.email,
        templateData: {},
    }, EmailTemplate.ACCOUNT_REQUEST_REJECTED, {
        accRequest,
    });
}

export async function createAccountRequest(firstName: string, lastName: string, email: string, company: string, description: string): Promise<AccountRequest> {
    const accRequest = await AccountRequestRepo.create(firstName, lastName, email, company, description);

    const [adminUsers] = await getAllAdminUsers(true, 0, 0);

    await sendAccountRequestAdminEmail(adminUsers, accRequest);
    await sendAccountRequestUserEmail(accRequest);

    return accRequest;
}

export async function rejectAccountRequest(accRequestId: string): Promise<AccountRequest> {
    const accRequest = await findAccountRequest(accRequestId);
    if (accRequest.status !== AccountRequestStatus.UNDECIDED) {
        throw Boom.conflict('Decision has already been taken for this request.');
    }

    await sendAccountRequestRejectionEmail(accRequest);

    accRequest.status = AccountRequestStatus.REJECTED;
    await AccountRequestRepo.updateStatus(accRequestId, accRequest.status);

    return accRequest;
}

export async function sendAccountRequestApprovalEmail(clientId: string, userId: string): Promise<void> {
    const user = await findUserByID(userId);
    if (!user) {
        throw Boom.notFound('User with this id does not exist');
    }

    const client = await findVendor(clientId);

    const token = await generateInvitationToken(user);
    const invitationURL = `${config.app.url}/accept-invitation?token=${encodeURIComponent(token)}`;

    await mailer.sendMail(config.transactionalEmailSource, {
        address: user.email,
        templateData: {
            user,
            client,
        },
    }, EmailTemplate.ACCOUNT_REQUEST_APPROVED, {
        invitationURL,
    });
}

export async function approveAccountRequest(accRequestId: string): Promise<AccountRequest> {
    const accRequest = await findAccountRequest(accRequestId);
    if (accRequest.status !== AccountRequestStatus.UNDECIDED) {
        throw Boom.conflict('Decision has already been taken for this request.');
    }

    const client = await createVendor(accRequest.company, VendorType.EXTERNAL, {
        userLimit: 1,
        productLimit: 0,
    });
    // if (!client.stripeCustomerId) {
    //     throw new Error('Expected Stripe Customer ID');
    // }

    let user = await findUserByEmail(accRequest.email).catch(() => null);
    if (!user) {
        user = await createUser(accRequest.email, Role.VENDOR);
    }

    // await setCustomerPrimaryContact(client.stripeCustomerId, user);

    if (user && user.role !== Role.VENDOR) {
        await deleteVendor(client.id);

        throw Boom.conflict('Requester is also a Super Admin');
    }

    await addUserToVendor(client.id, user.id, VendorRole.ADMIN);
    await sendAccountRequestApprovalEmail(client.id, user.id);

    accRequest.status = AccountRequestStatus.APPROVED;
    await AccountRequestRepo.updateStatus(accRequestId, accRequest.status);

    return accRequest;
}
