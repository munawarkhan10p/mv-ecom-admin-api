import TransactionalEmailQueue from '../queues/TransactionalEmailQueue';
import { EmailTemplate } from '../utils/emailTemplater';
import { Mailer, MailRecipient } from '../utils/mailer';

class QueueMailer implements Mailer {
    async sendMail(from: string, to: MailRecipient | MailRecipient[], templateName: EmailTemplate, templateData: object): Promise<void> {
        if (!Array.isArray(to)) {
            to = [to];
        }

        await TransactionalEmailQueue.publish({
            args: {
                from,
                to,
                templateName,
                templateData,
            },
        });
    }
}

export default new QueueMailer();
