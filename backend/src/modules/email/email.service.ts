import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  context?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templatesDir: string;

  constructor(private readonly configService: ConfigService) {
    this.templatesDir = this.configService.get('EMAIL_TEMPLATES_DIR') || './templates/email';
    
    // Register Handlebars helpers
    handlebars.registerHelper('eq', function(a: any, b: any) {
      return a === b;
    });

    // Initialize transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get('SMTP_PORT') || '587', 10),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });

    // Verify connection
    this.verifyConnection();
  }

  /**
   * Verify SMTP connection
   */
  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified');
    } catch (error) {
      this.logger.warn(`SMTP connection failed: ${error.message}`);
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      let html = options.html;
      let text = options.text;

      // Load and render template if provided
      if (options.template) {
        const templateContent = await this.loadTemplate(options.template);
        const template = handlebars.compile(templateContent);
        html = template(options.context || {});
        text = this.htmlToText(html);
      }

      const mailOptions: nodemailer.SendMailOptions = {
        from: this.configService.get('SMTP_FROM') || this.configService.get('SMTP_USER'),
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        subject: options.subject,
        text: text,
        html: html,
        attachments: options.attachments,
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent: ${info.messageId} to ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send payment reminder email
   */
  async sendPaymentReminder(
    email: string,
    loanDetails: {
      loanId: string;
      customerName: string;
      amountDue: number;
      dueDate: string;
      paymentLink?: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Payment Reminder - Loan ${loanDetails.loanId}`,
      template: 'payment-reminder',
      context: {
        ...loanDetails,
        formattedAmount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(loanDetails.amountDue),
      },
    });
  }

  /**
   * Send loan statement email
   */
  async sendLoanStatement(
    email: string,
    statementDetails: {
      loanId: string;
      customerName: string;
      statementPeriod: string;
      statementPdf?: Buffer;
    },
  ): Promise<void> {
    const attachments = statementDetails.statementPdf
      ? [
          {
            filename: `statement-${statementDetails.loanId}.pdf`,
            content: statementDetails.statementPdf,
            contentType: 'application/pdf',
          },
        ]
      : undefined;

    await this.sendEmail({
      to: email,
      subject: `Loan Statement - ${statementDetails.statementPeriod}`,
      template: 'loan-statement',
      context: statementDetails,
      attachments,
    });
  }

  /**
   * Send application status email
   */
  async sendApplicationStatus(
    email: string,
    applicationDetails: {
      applicationId: string;
      customerName: string;
      status: string;
      message?: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Loan Application ${applicationDetails.status}`,
      template: 'application-status',
      context: applicationDetails,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(
    email: string,
    resetDetails: {
      resetToken: string;
      resetLink: string;
      expiresIn: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: resetDetails,
    });
  }

  /**
   * Load email template
   */
  private async loadTemplate(templateName: string): Promise<string> {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
      if (fs.existsSync(templatePath)) {
        return fs.readFileSync(templatePath, 'utf-8');
      }

      // Return default template if not found
      this.logger.warn(`Template not found: ${templateName}, using default`);
      return this.getDefaultTemplate(templateName);
    } catch (error) {
      this.logger.error(`Failed to load template: ${error.message}`);
      return this.getDefaultTemplate(templateName);
    }
  }

  /**
   * Get default template
   */
  private getDefaultTemplate(templateName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Uruti Lending</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>{{message}}</p>
    </div>
    <div class="footer">
      <p>© 2024 Uruti Lending. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Convert HTML to text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}

