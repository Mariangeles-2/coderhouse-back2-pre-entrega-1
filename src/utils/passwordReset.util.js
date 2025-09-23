import { randomBytes } from 'crypto';

import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

import { logger } from './logger.util.js';

/**
 * 📧 Servicio mejorado de recuperación de contraseñas
 * Con expiración de tokens y validación de contraseña anterior
 */
class PasswordResetService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * 🔑 Generar token de recuperación con expiración de 1 hora
   */
  generateResetToken() {
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    return { token, expires };
  }

  /**
   * 📨 Enviar email de recuperación con botón
   */
  async sendResetEmail(userEmail, resetToken, userName) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: `"${process.env.APP_NAME || 'Ecommerce Backend'}" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: '🔐 Recuperación de Contraseña - Ecommerce Backend',
        html: this._generateResetEmailHTML(userName, resetUrl, resetToken),
      };

      await this.transporter.sendMail(mailOptions);
      logger.success(`📧 Email de recuperación enviado a: ${userEmail}`);
      return true;
    } catch (error) {
      logger.error('❌ Error enviando email de recuperación:', error);
      throw new Error('Error enviando email de recuperación');
    }
  }

  /**
   * 🎨 Generar HTML para email de recuperación
   */
  _generateResetEmailHTML(userName, resetUrl, token) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #5a6fd8; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .token-info { background: #e9ecef; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Recuperación de Contraseña</h1>
                <p>Ecommerce Backend</p>
            </div>
            <div class="content">
                <h2>Hola ${userName},</h2>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
                
                <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">🔑 Restablecer Contraseña</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul>
                        <li>Este enlace expira en <strong>1 hora</strong></li>
                        <li>No podrás usar tu contraseña anterior</li>
                        <li>Si no solicitaste este cambio, ignora este email</li>
                    </ul>
                </div>
                
                <p><strong>Token de recuperación:</strong></p>
                <div class="token-info">${token}</div>
                
                <p>Si el botón no funciona, copia y pega esta URL en tu navegador:</p>
                <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
                
                <p>Por tu seguridad, este enlace se desactivará automáticamente después de ser usado o al expirar.</p>
            </div>
            <div class="footer">
                <p>Este email fue enviado automáticamente. No respondas a este mensaje.</p>
                <p>&copy; ${new Date().getFullYear()} Ecommerce Backend. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * ✅ Validar que la nueva contraseña sea diferente a la anterior
   */
  async validateNewPassword(newPassword, currentHashedPassword) {
    try {
      const isSamePassword = await bcrypt.compare(newPassword, currentHashedPassword);
      if (isSamePassword) {
        throw new Error('La nueva contraseña debe ser diferente a la anterior');
      }
      return true;
    } catch (error) {
      if (error.message.includes('diferente')) {
        throw error;
      }
      logger.error('❌ Error validando nueva contraseña:', error);
      throw new Error('Error validando la nueva contraseña');
    }
  }

  /**
   * 🔍 Verificar token de reset (validez y expiración)
   */
  isTokenValid(tokenExpires) {
    return tokenExpires && new Date() < new Date(tokenExpires);
  }

  /**
   * 📧 Enviar confirmación de cambio de contraseña
   */
  async sendPasswordChangedConfirmation(userEmail, userName) {
    try {
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'Ecommerce Backend'}" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: '✅ Contraseña Cambiada Exitosamente',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">✅ Contraseña Cambiada</h2>
            <p>Hola ${userName},</p>
            <p>Tu contraseña ha sido cambiada exitosamente en <strong>${new Date().toLocaleString()}</strong>.</p>
            <p>Si no realizaste este cambio, contacta inmediatamente a nuestro soporte.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">Este email fue enviado automáticamente.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.success(`📧 Confirmación de cambio de contraseña enviada a: ${userEmail}`);
    } catch (error) {
      logger.error('❌ Error enviando confirmación de cambio:', error);
      // No lanzamos error aquí para no interrumpir el proceso principal
    }
  }
}

export const passwordResetService = new PasswordResetService();
