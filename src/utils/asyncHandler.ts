import * as express from 'express';

export function wrapAsync(fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>) {
    return async function(_req: express.Request, _res: express.Response, _next: express.NextFunction): Promise<void> {
        try {
            await fn(_req, _res, _next);
        } catch (err) {
            _next(err);
        }
    };
}
