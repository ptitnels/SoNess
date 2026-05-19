// api/sorare.js
// Proxy côté serveur pour l'API GraphQL Sorare — évite les blocages CORS.
// Transmet l'en-tête Authorization pour les requêtes authentifiées.

const https = require('https');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ errors: [{ message: 'POST only' }] });
  }

  const body = JSON.stringify(req.body);
  const authHeader = req.headers['authorization'];

  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'User-Agent': 'soness-app/1.0',
  };
  if (authHeader) headers['Authorization'] = authHeader;

  try {
    const data = await new Promise((resolve, reject) => {
      const req2 = https.request(
        {
          hostname: 'api.sorare.com',
          path: '/federation/graphql',
          method: 'POST',
          headers,
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

    return res.status(data.status).json(data.json);
  } catch (err) {
    console.error('Sorare proxy error:', err);
    return res.status(500).json({
      errors: [{ message: 'Proxy error: ' + (err.message || String(err)) }],
    });
  }
};
