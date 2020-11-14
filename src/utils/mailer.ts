import * as AWS from 'aws-sdk';
import nodemailer from 'nodemailer';

import { EmailTemplate, EmailTemplater } from './emailTemplater';

export type MailRecipient = {
    address: string;
    templateData: object;
}

export interface Mailer {
    sendMail(from: string, to: MailRecipient | MailRecipient[], templateName: EmailTemplate, templateData: object): Promise<void>;
}

export class SESMailer implements Mailer {
    private templater: EmailTemplater;
    private ses: AWS.SES;

    constructor(templater: EmailTemplater, ses: AWS.SES) {
        this.templater = templater;
        this.ses = ses;
    }

    async sendMail(from: string, to: MailRecipient | MailRecipient[], templateName: EmailTemplate, templateData: object): Promise<void> {
        if (!Array.isArray(to)) {
            to = [to];
        }
        console.log('mail sending')

        await Promise.all(to.map(async (recipient) => {
            const [subject, text, html] = await this.templater.render(templateName, {
                ...templateData,
                ...recipient.templateData,
            });

            return this.ses.sendEmail({
                Source: from,
                Destination: {
                    ToAddresses: [recipient.address],
                },
                Message: {
                    Subject: { Data: subject },
                    Body: {
                        Text: { Data: text },
                        Html: { Data: html },
                    },
                },
            }).promise();
        }));
    }
}

export class SMTPMailer implements Mailer {
    private templater: EmailTemplater;
    private transporter: nodemailer.Transporter;

    constructor(templater: EmailTemplater, host: string, port: number, secure: boolean, user: string, pass: string) {
        this.templater = templater;

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
                user,
                pass,
            },
        });
    }

    async sendMail(from: string, to: MailRecipient | MailRecipient[], templateName: EmailTemplate, templateData: object): Promise<void> {
        if (!Array.isArray(to)) {
            to = [to];
        }

        await Promise.all(to.map(async (recipient) => {
            const [subject, text, html] = await this.templater.render(templateName, {
                ...templateData,
                ...recipient.templateData,
            });

            return this.transporter.sendMail({
                from,
                to: recipient.address,
                subject,
                text,
                html,
            });
        }));
    }
}