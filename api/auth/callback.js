// api/auth/callback.js
module.exports = async function handler(req, res) {
  const { code, error } = req.query;
  const appUrl = process.env.APP_URL || 'https://so-ness.vercel.app';

  if (error || !code) {
    return res.redirect(`${appUrl}/?auth_error=${encodeURIComponent(error || 'missing_code')}`);
  }

  try {
    const clientId = process.env.SORARE_CLIENT_ID;
    const clientSecret = process.env.SORARE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing env vars - CLIENT_ID:', !!clientId, 'CLIENT_SECRET:', !!clientSecret);
      return res.redirect(`${appUrl}/?auth_error=missing_env_vars`);
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await fetch('https://api.sorare.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${appUrl}/api/auth/callback`,
      }).toString(),
    });

    const text = await tokenRes.text();
    console.log('Sorare token response:', tokenRes.status, text.slice(0, 200));

    let data;
    try { data = JSON.parse(text); }
    catch (e) {
      return res.redirect(`${appUrl}/?auth_error=invalid_response&detail=${encodeURIComponent(text.slice(0, 100))}`);
    }

    if (!data.access_token) {
      const errCode = encodeURIComponent(data.error || 'no_token');
      const errDetail = encodeURIComponent(data.error_description || JSON.stringify(data).slice(0, 100));
      return res.redirect(`${appUrl}/?auth_error=${errCode}&detail=${errDetail}`);
    }

    return res.redirect(`${appUrl}/#access_token=${data.access_token}`);
  } catch (e) {
    console.error('Callback error:', e);
    return res.redirect(`${appUrl}/?auth_error=exception&detail=${encodeURIComponent(e.message)}`);
  }
};
