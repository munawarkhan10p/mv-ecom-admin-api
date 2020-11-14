import * as Logger from 'bunyan';
import { ClientUser } from 'src/models/VendorUser';
import { User } from 'src/models/User';

declare module 'express-serve-static-core' {
    interface Request {
        log: Logger;
        user?: User;
        vendorUsers?: ClientUser[];

    }
}
