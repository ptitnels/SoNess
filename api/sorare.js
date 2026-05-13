// api/sorare.js
// Proxy vers l'API GraphQL Sorare pour contourner les restrictions CORS du navigateur.
// Cette fonction s'exécute côté serveur sur Vercel, donc pas de blocage CORS.
// Elle reçoit les requêtes du frontend, les relaie à Sorare, et renvoie la réponse.
 
export default async function handler(req, res) {
  // On n'accepte que les requêtes POST (les queries GraphQL)
  if (req.method !== 'POST') {
    return res.status(405).json({
      errors: [{ message: 'Méthode non autorisée. Utilise POST.' }]
    });
  }
 
  try {
    const sorareResponse = await fetch('https://api.sorare.com/federation/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ness-sorare-app/1.0'
      },
      body: JSON.stringify(req.body)
    });
 
    const data = await sorareResponse.json();
    return res.status(sorareResponse.status).json(data);
  } catch (err) {
    console.error('Erreur proxy Sorare:', err);
    return res.status(500).json({
      errors: [{ message: 'Erreur de communication avec Sorare : ' + (err.message || String(err)) }]
    });
  }
}
