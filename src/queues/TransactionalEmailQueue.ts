import Joi from '@hapi/joi';
import Bunyan from 'bunyan';

import config from '../config';
import { SES } from '../utils/aws';
import { EmailTemplate, MustacheEmailTemplater } from '../utils/emailTemplater';
import { MailRecipient, Mailer, SESMailer, SMTPMailer } from '../utils/mailer';

import { Queue } from './queue';

type TransactionalEmailMessage = {
    args: {
        from: string;
        to: MailRecipient[];
        templateName: EmailTemplate;
        templateData: object;
    };
}

class TransactionalEmailQueue extends Queue<TransactionalEmailMessage> {
    constructor() {
        super('TransactionalEmail', config.sqs.transactionalEmail);

        const templater = new MustacheEmailTemplater();

        let mailer: Mailer;

        switch (config.env) {
        case 'development1':
        case 'staging1':
            mailer = new SMTPMailer(templater, config.smtp.host, config.smtp.port, config.smtp.secure, config.smtp.user, config.smtp.pass);
            break;
        default:
            mailer = new SESMailer(templater, SES);
            break;
        }

        this.setConsumer(async (message: TransactionalEmailMessage, log: Bunyan): Promise<void> => {
            const { args: { from, to, templateName, templateData } } = await Joi.object({
                args: Joi.object({
                    from: Joi.string().required(),
                    to: Joi.array().min(1).items(
                        Joi.object({
                            address: Joi.string().required(),
                            templateData: Joi.object().required(),
                        })
                    ).required(),
                    templateName: Joi.string().valid(...Object.values(EmailTemplate)).required(),
                    templateData: Joi.object().required(),
                }).required(),
            }).validateAsync(message);

            await mailer.sendMail(from, to, templateName, templateData);

            log.info('Email sent');
        });
    }
}

export default new TransactionalEmailQueue();
