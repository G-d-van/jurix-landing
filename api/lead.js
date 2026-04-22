const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const LEAD_TO_EMAIL = '3630013@mail.ru';
const DEFAULT_FROM_EMAIL = 'noreply@mail.ooostop.ru';

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';

  if (!email || !phone) {
    return json(res, 400, { ok: false, error: 'Email and phone are required' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return json(res, 500, { ok: false, error: 'RESEND_API_KEY is not configured' });
  }

  const subject = typeof body._subject === 'string' ? body._subject : 'Заявка с сайта';
  const service = typeof body.service === 'string' ? body.service : '';
  const situation = typeof body.situation === 'string' ? body.situation : '';
  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;

  const html = `
    <h2>${subject}</h2>
    <p><strong>Услуга:</strong> ${service || 'Не указана'}</p>
    <p><strong>Телефон:</strong> ${phone}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Ситуация:</strong><br>${(situation || 'Не указана').replace(/\n/g, '<br>')}</p>
  `;
  const text =
    `${subject}\n\n` +
    `Услуга: ${service || 'Не указана'}\n` +
    `Телефон: ${phone}\n` +
    `Email: ${email}\n` +
    `Ситуация: ${situation || 'Не указана'}`;

  try {
    const upstream = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [LEAD_TO_EMAIL],
        reply_to: email,
        subject,
        html,
        text
      })
    });

    const raw = await upstream.text();
    console.log('Resend response:', upstream.status, raw);
    if (!upstream.ok) {
      let resendError = 'Failed to send email via Resend';
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed.message === 'string' && parsed.message.trim()) {
          resendError = parsed.message.trim();
        }
      } catch (_) {}
      console.error('Resend error:', upstream.status, raw);
      return json(res, 502, { ok: false, error: resendError });
    }

    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch (_) {
      data = null;
    }
    return json(res, 200, { ok: true, provider: 'resend', id: data && data.id ? data.id : null });
  } catch (error) {
    console.error('Lead handler exception:', error);
    return json(res, 502, { ok: false, error: 'Failed to send lead' });
  }
}
