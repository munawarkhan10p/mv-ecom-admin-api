import { promises as fs } from 'fs';
import path from 'path';

import Mustache from 'mustache';

import config from '../config';

export enum EmailTemplate {
    ACCOUNT_REQUEST_ADMIN = 'account-request-admin',
    ACCOUNT_REQUEST_USER = 'account-request-user',
    ACCOUNT_REQUEST_APPROVED = 'account-request-approved',
    ACCOUNT_REQUEST_REJECTED = 'account-request-rejected',
    USER_INVITATION = 'user-invitation',
    VENDOR_INVITATION = 'vendor-invitation',
    SEARCH_QUERY_ALERT = 'search-query-alert',
    TARGET_READY_ADMIN = 'target-ready-admin',
    RESET_PASSWORD = 'reset-password',
    REPORT_DOCUMENT_READY = 'report-document-ready',
}

export interface EmailTemplater {
    render(template: EmailTemplate, data: object): Promise<[string, string, string]>;
}

export class MustacheEmailTemplater implements EmailTemplater {
    private cached = false;

    static templatePath(name: EmailTemplate, type: 'subject' | 'text' | 'html'): string {
        return path.join(__dirname, `../emailTemplates/${name}-${type}.mustache`);
    }

    private async cache(): Promise<void> {
        const templates = [
            EmailTemplate.USER_INVITATION,
            EmailTemplate.VENDOR_INVITATION,
            EmailTemplate.SEARCH_QUERY_ALERT,
            EmailTemplate.TARGET_READY_ADMIN,
            EmailTemplate.RESET_PASSWORD,
            EmailTemplate.REPORT_DOCUMENT_READY,
        ];

        for (const template of templates) {
            const subjectTmpl = await fs.readFile(MustacheEmailTemplater.templatePath(template, 'subject'));
            const textTmpl = await fs.readFile(MustacheEmailTemplater.templatePath(template, 'text'));
            const htmlTmpl = await fs.readFile(MustacheEmailTemplater.templatePath(template, 'html'));

            Mustache.parse(subjectTmpl.toString());
            Mustache.parse(textTmpl.toString());
            Mustache.parse(htmlTmpl.toString());
        }
    }

    async render(template: EmailTemplate, data: object): Promise<[string, string, string]> {
        if (!this.cached) {
            await this.cache();

            this.cached = true;
        }

        data = {
            ...data,
            app: config.app,
        };

        const subjectTmpl = await fs.readFile(MustacheEmailTemplater.templatePath(template, 'subject'));
        const textTmpl = await fs.readFile(MustacheEmailTemplater.templatePath(template, 'text'));
        const htmlTmpl = await fs.readFile(MustacheEmailTemplater.templatePath(template, 'html'));

        const subject = Mustache.render(subjectTmpl.toString(), data);
        const text = Mustache.render(textTmpl.toString(), data);
        const html = Mustache.render(htmlTmpl.toString(), data);

        return [subject, text, html];
    }
}
