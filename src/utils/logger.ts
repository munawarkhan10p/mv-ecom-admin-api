import Bunyan from 'bunyan';

import config from '../config';

export default new Bunyan({
    name: 'Node-API',
    serializers: Bunyan.stdSerializers,
    streams: [{
        level: config.env !== 'production' ? 'debug' : 'info',
        stream: process.stdout,
    }],
});
