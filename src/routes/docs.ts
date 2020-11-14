import path from 'path';

import { Router } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';

const router = Router();

const swaggerSpecs = swaggerJSDoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Node Analytics API',
            version: '1.0.0',
        },
    },
    apis: [path.join(__dirname, './*')],
});

router.get('/swagger.json', (req, res) => {
    res.send(swaggerSpecs);
});

export default router;
