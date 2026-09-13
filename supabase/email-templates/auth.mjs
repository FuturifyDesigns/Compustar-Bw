import { emailShell, ctaButton } from './shell.mjs';

/** Supabase Go template vars: {{ .ConfirmationURL }} {{ .Token }} {{ .SiteURL }} {{ .Email }} */

export const authSubjects = {
  mailer_subjects_confirmation: 'Confirm your Compustar account',
  mailer_subjects_recovery: 'Reset your Compustar password',
  mailer_subjects_magic_link: 'Your Compustar sign-in link',
  mailer_subjects_email_change: 'Confirm your new Compustar email',
  mailer_subjects_invite: 'You’re invited to Compustar'
};

export const authTemplates = {
  mailer_templates_confirmation_content: emailShell({
    title: 'Confirm your email',
    preheader: 'Verify your Compustar Botswana account to continue.',
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Welcome to Compustar Botswana.</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Please confirm this email address to finish creating your account and start submitting order requests.</p>
      ${ctaButton('{{ .ConfirmationURL }}', 'Verify email address')}
      <p style="margin:18px 0 0;font-size:13px;line-height:1.5;color:#69727f;">If you did not create a Compustar account, you can ignore this message.</p>
    `
  }),

  mailer_templates_recovery_content: emailShell({
    title: 'Reset your password',
    preheader: 'Choose a new password for your Compustar account.',
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">We received a request to reset the password for your Compustar account.</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Use the button below to choose a new password. This link expires shortly and can only be used once.</p>
      ${ctaButton('{{ .ConfirmationURL }}', 'Reset password')}
      <p style="margin:18px 0 0;font-size:13px;line-height:1.5;color:#69727f;">If you did not request a password reset, you can safely ignore this email.</p>
    `
  }),

  mailer_templates_magic_link_content: emailShell({
    title: 'Sign in to Compustar',
    preheader: 'Use this secure link to sign in.',
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Use the secure link below to sign in to your Compustar account.</p>
      ${ctaButton('{{ .ConfirmationURL }}', 'Sign in')}
      <p style="margin:18px 0 0;font-size:13px;line-height:1.5;color:#69727f;">This link expires shortly and can only be used once.</p>
    `
  }),

  mailer_templates_email_change_content: emailShell({
    title: 'Confirm your new email',
    preheader: 'Confirm the new email address for your Compustar account.',
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Please confirm <strong>{{ .NewEmail }}</strong> as the new email address for your Compustar account.</p>
      ${ctaButton('{{ .ConfirmationURL }}', 'Confirm new email')}
      <p style="margin:18px 0 0;font-size:13px;line-height:1.5;color:#69727f;">If you did not request this change, contact Compustar support.</p>
    `
  }),

  mailer_templates_invite_content: emailShell({
    title: 'You’re invited',
    preheader: 'Create your Compustar account.',
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">You’ve been invited to create a Compustar Botswana account.</p>
      ${ctaButton('{{ .ConfirmationURL }}', 'Accept invitation')}
    `
  })
};
