// api/sorare.js
// Server-side proxy for Sorare's GraphQL API — avoids CORS issues from the browser.
// Forwards the Authorization header so authenticated queries work.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ errors: [{ message: 'POST only' }] });
  }

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'soness-app/1.0',
  };

  const auth = req.headers['authorization'];
  if (auth) headers['Authorization'] = auth;

  try {
    const sorareRes = await fetch('https://api.sorare.com/federation/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    });

    const data = await sorareRes.json();
    return res.status(sorareRes.status).json(data);
  } catch (err) {
    console.error('Sorare proxy error:', err);
    return res.status(500).json({
      errors: [{ message: 'Proxy error: ' + (err.message || String(err)) }],
    });
  }
}
