const FORM_SUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/3630013@mail.ru';

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

  const payload = {
    _subject: typeof body._subject === 'string' ? body._subject : 'Заявка с сайта',
    _template: 'table',
    _captcha: 'false',
    _autoresponse: typeof body._autoresponse === 'string' ? body._autoresponse : '',
    service: typeof body.service === 'string' ? body.service : '',
    situation: typeof body.situation === 'string' ? body.situation : '',
    phone,
    email
  };

  try {
    const upstream = await fetch(FORM_SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const raw = await upstream.text();
    if (!upstream.ok) {
      return json(res, upstream.status, { ok: false, error: raw || 'Upstream error' });
    }

    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 502, { ok: false, error: 'Failed to send lead' });
  }
}
