"""
Email service for Project Mizan.
Uses Brevo SMTP for sending emails.
"""
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Centralized email service for all app emails."""
    
    @staticmethod
    def send_email(subject: str, html_content: str, recipient_list: list, 
                   from_email: str = None, fail_silently: bool = True) -> bool:
        """
        Send an HTML email with plain text fallback.
        """
        try:
            from_email = from_email or settings.DEFAULT_FROM_EMAIL
            text_content = strip_tags(html_content)
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=recipient_list
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=fail_silently)
            logger.info(f"Email sent to {recipient_list}: {subject}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    @classmethod
    def send_password_reset(cls, email: str, reset_url: str, user_name: str = "User") -> bool:
        """Send password reset email."""
        subject = "Reset Your Project Mizan Password"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #3b82f6, #4f46e5); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }}
                .button {{ display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #64748b; font-size: 12px; padding: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset</h1>
                </div>
                <div class="content">
                    <p>Assalamu Alaikum {user_name},</p>
                    <p>You requested to reset your password for Project Mizan. Click the button below to create a new password:</p>
                    <p style="text-align: center;">
                        <a href="{reset_url}" class="button" style="color: white;">Reset Password</a>
                    </p>
                    <p>This link will expire in 1 hour for security reasons.</p>
                    <p>If you didn't request this, please ignore this email or contact your administrator.</p>
                    <p>JazakAllah Khair,<br>Project Mizan Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from Project Mizan - Digital Ummah Foundation</p>
                </div>
            </div>
        </body>
        </html>
        """
        return cls.send_email(subject, html_content, [email])
    
    @classmethod
    def send_email_verification(cls, email: str, verification_url: str, 
                                 masjid_name: str = "Your Masjid") -> bool:
        """Send email verification for new tenant registration."""
        subject = f"Verify Your Email - {masjid_name} on Project Mizan"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #3b82f6, #4f46e5); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }}
                .button {{ display: inline-block; background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #64748b; font-size: 12px; padding: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Project Mizan!</h1>
                </div>
                <div class="content">
                    <p>Assalamu Alaikum,</p>
                    <p>Thank you for registering <strong>{masjid_name}</strong> on Project Mizan.</p>
                    <p>Please verify your email address by clicking the button below:</p>
                    <p style="text-align: center;">
                        <a href="{verification_url}" class="button" style="color: white;">Verify Email</a>
                    </p>
                    <p>After verification, you can access your dashboard and start managing your Jamath.</p>
                    <p>JazakAllah Khair,<br>Project Mizan Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from Project Mizan - Digital Ummah Foundation</p>
                </div>
            </div>
        </body>
        </html>
        """
        return cls.send_email(subject, html_content, [email])
    
    @classmethod
    def send_payment_reminder(cls, email: str, household_name: str, 
                               amount: float, due_date: str, 
                               payment_url: str, masjid_name: str = "Masjid") -> bool:
        """Send membership payment reminder."""
        subject = f"Payment Reminder - {masjid_name} Membership"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }}
                .amount-box {{ background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }}
                .amount {{ font-size: 28px; font-weight: bold; color: #d97706; }}
                .button {{ display: inline-block; background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #64748b; font-size: 12px; padding: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Payment Reminder</h1>
                </div>
                <div class="content">
                    <p>Assalamu Alaikum <strong>{household_name}</strong>,</p>
                    <p>This is a friendly reminder that your membership payment for <strong>{masjid_name}</strong> is due.</p>
                    <div class="amount-box">
                        <p style="margin: 0;">Amount Due</p>
                        <p class="amount">₹{amount:,.2f}</p>
                        <p style="margin: 0; color: #92400e;">Due Date: {due_date}</p>
                    </div>
                    <p style="text-align: center;">
                        <a href="{payment_url}" class="button" style="color: white;">Pay Now</a>
                    </p>
                    <p>Your timely contribution helps us maintain and serve our community better.</p>
                    <p>JazakAllah Khair,<br>{masjid_name} Committee</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from Project Mizan - Digital Ummah Foundation</p>
                </div>
            </div>
        </body>
        </html>
        """
        return cls.send_email(subject, html_content, [email])
    
    @classmethod
    def send_announcement(cls, recipients: list, title: str, content: str,
                          masjid_name: str = "Masjid") -> int:
        """
        Send announcement email to multiple recipients.
        Returns count of successfully sent emails.
        """
        subject = f"[{masjid_name}] {title}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #3b82f6, #4f46e5); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }}
                .announcement-box {{ background: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #64748b; font-size: 12px; padding: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{masjid_name}</h1>
                    <p style="margin: 0;">Announcement</p>
                </div>
                <div class="content">
                    <p>Assalamu Alaikum,</p>
                    <div class="announcement-box">
                        <h2 style="margin-top: 0; color: #3b82f6;">{title}</h2>
                        <p>{content}</p>
                    </div>
                    <p>JazakAllah Khair,<br>{masjid_name} Committee</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from Project Mizan - Digital Ummah Foundation</p>
                </div>
            </div>
        </body>
        </html>
        """
        success_count = 0
        for recipient in recipients:
            if cls.send_email(subject, html_content, [recipient]):
                success_count += 1
        return success_count


# Convenience functions for backward compatibility
def send_password_reset_email(email: str, reset_url: str, user_name: str = "User") -> bool:
    return EmailService.send_password_reset(email, reset_url, user_name)

def send_verification_email(email: str, verification_url: str, masjid_name: str = "Your Masjid") -> bool:
    return EmailService.send_email_verification(email, verification_url, masjid_name)

def send_payment_reminder_email(email: str, household_name: str, amount: float, 
                                 due_date: str, payment_url: str, masjid_name: str = "Masjid") -> bool:
    return EmailService.send_payment_reminder(email, household_name, amount, due_date, payment_url, masjid_name)
