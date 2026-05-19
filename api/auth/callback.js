// api/auth/callback.js
// Reçoit le code OAuth de Sorare, l'échange contre un access_token (côté serveur),
// puis redirige vers le front avec le token dans le hash URL.

const https = require('https');
const querystring = require('querystring');

module.exports = async function handler(req, res) {
  const { code, error } = req.query;
  const appUrl = process.env.APP_URL || 'https://so-ness.vercel.app';

  if (error) {
    return res.redirect(`${appUrl}/?auth_error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return res.redirect(`${appUrl}/?auth_error=missing_code`);
  }

  const redirectUri = process.env.SORARE_REDIRECT_URI || `${appUrl}/api/auth/callback`;

  const body = querystring.stringify({
    grant_type: 'authorization_code',
    code,
    client_id: process.env.SORARE_CLIENT_ID,
    client_secret: process.env.SORARE_CLIENT_SECRET,
    redirect_uri: redirectUri,
  });

  try {
    const data = await new Promise((resolve, reject) => {
      const req2 = https.request(
        {
          hostname: 'sorare.com',
          path: '/oauth/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (r) => {
          let raw = '';
          r.on('data', (c) => (raw += c));
          r.on('end', () => {
            try { resolve({ status: r.statusCode, json: JSON.parse(raw) }); }
            catch (e) { reject(new Error('Invalid JSON: ' + raw)); }
          });
        }
      );
      req2.on('error', reject);
      req2.write(body);
      req2.end();
    });

    if (data.status !== 200 || !data.json.access_token) {
      console.error('Token exchange failed:', data.json);
      return res.redirect(`${appUrl}/?auth_error=token_exchange_failed`);
    }

    const params = new URLSearchParams({ access_token: data.json.access_token });
    if (data.json.refresh_token) params.set('refresh_token', data.json.refresh_token);
    if (data.json.expires_in)   params.set('expires_in',    String(data.json.expires_in));

    return res.redirect(`${appUrl}/#${params.toString()}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.redirect(`${appUrl}/?auth_error=server_error`);
  }
};
