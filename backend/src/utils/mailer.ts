import nodemailer from 'nodemailer';

/**
 * Sends the password-reset link. For this project we use a Nodemailer Ethereal
 * test account (no real SMTP needed) and always log the link + preview URL to
 * the console so the flow can be demonstrated locally.
 */
export async function sendResetEmail(to: string, link: string): Promise<void> {
  console.log(`\n[Password reset] for ${to}\n  Link (valid 30 min): ${link}\n`);
  try {
    const account = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });
    const info = await transporter.sendMail({
      from: '"SportSphere Hub" <no-reply@sportsphere.rs>',
      to,
      subject: 'Resetovanje lozinke — SportSphere Hub',
      text: `Kliknite na link da postavite novu lozinku (važi 30 minuta): ${link}`,
      html: `<p>Kliknite na link da postavite novu lozinku (važi 30 minuta):</p><p><a href="${link}">${link}</a></p>`,
    });
    console.log(`[Password reset] Ethereal preview: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (err) {
    console.warn('[Password reset] Could not send email (using console link only):', (err as Error).message);
  }
}
