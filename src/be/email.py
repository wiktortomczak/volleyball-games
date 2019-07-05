"""Automated email sending."""

import sendgrid
from sendgrid.helpers import mail

from base import executor
from base import thread_pool
thread_pool.CreateBackgroundThreadExecutor()


def SendEmail(to, subject, content, content_type='text/plain'):
  """Sends an email from a preconfigured sendgrid account. Blocking.

  Args:
    to: str. Email address. Email recipient (addressee). 
    subject: str. Email subject.
    content: str. Email body. Should match content_type.
    content_type: str. Mime type.
  Raises:
    Exception. If sending email failed (status code is not 200 nor 202).
  """
  response = _SEND_GRID_CLIENT.client.mail.send.post(request_body=mail.Mail(
    _FROM, subject, mail.Email(to),
    mail.Content(content_type, content)).get())
  if response.status_code not in (200, 202):
    raise Exception('Error sending email to=%s subject=%s\n%s\n%s' % (
      to, subject, response.status_code, response.body))


def SendEmailAsync(to, subject, content, content_type='text/plain'):
  """Sends an email from a preconfigured sendgrid account. Non-blocking.

  Args:
    See SendEmail.
  """
  return executor.Executor.BACKGROUND_THREAD.Execute(
    SendEmail, to, subject, content, content_type)


# Preconfigured email account for sending emails.
# TODO: Remove the key from source code.
_SEND_GRID_API_KEY = (
  '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')
# SendGrid email service client.
_SEND_GRID_CLIENT = sendgrid.SendGridAPIClient(apikey=_SEND_GRID_API_KEY)
# Email sender identity (appears in the email's 'from' line).
_FROM = mail.Email(
  email='noreply@volleyball-warsaw.tk', name='Volleyball in Warsaw')
