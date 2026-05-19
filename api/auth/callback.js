// api/auth/callback.js
// Exchanges the OAuth authorization code for an access token (server-side, keeps client_secret secure).
// Redirects back to the SPA with the token in the URL hash so the frontend can store it.

export default async function handler(req, res) {
  const { code, error } = req.query;
  const appUrl = process.env.APP_URL || 'https://so-ness.vercel.app';

  if (error) {
    return res.redirect(`${appUrl}/?auth_error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return res.redirect(`${appUrl}/?auth_error=missing_code`);
  }

  const redirectUri = process.env.SORARE_REDIRECT_URI
    || `${appUrl}/api/auth/callback`;

  try {
    const tokenRes = await fetch('https://sorare.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.SORARE_CLIENT_ID,
        client_secret: process.env.SORARE_CLIENT_SECRET,
        redirect_uri: redirectUri,
      }).toString(),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok || !data.access_token) {
      console.error('Token exchange failed:', data);
      return res.redirect(`${appUrl}/?auth_error=token_exchange_failed`);
    }

    const params = new URLSearchParams({ access_token: data.access_token });
    if (data.refresh_token) params.set('refresh_token', data.refresh_token);
    if (data.expires_in)   params.set('expires_in',    String(data.expires_in));

    return res.redirect(`${appUrl}/#${params.toString()}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.redirect(`${appUrl}/?auth_error=server_error`);
  }
}
