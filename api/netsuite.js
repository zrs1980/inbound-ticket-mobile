import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const accountId     = process.env.NS_ACCOUNT_ID;
  const consumerKey    = process.env.NS_CONSUMER_KEY;
  const consumerSecret = process.env.NS_CONSUMER_SECRET;
  const tokenId        = process.env.NS_TOKEN_ID;
  const tokenSecret    = process.env.NS_TOKEN_SECRET;

  if (!accountId || !consumerKey || !consumerSecret || !tokenId || !tokenSecret) {
    return res.status(500).json({ error: 'NetSuite credentials not configured on server' });
  }

  const { path, ...queryParams } = req.query;
  if (!path) return res.status(400).json({ error: 'Missing path parameter' });

  // Build the full NetSuite URL including any query params
  const baseUrl = `https://${accountId}.suitetalk.api.netsuite.com/services/rest${path}`;
  const urlObj = new URL(baseUrl);
  Object.entries(queryParams).forEach(([k, v]) => urlObj.searchParams.set(k, v));
  const fullUrl = urlObj.toString();

  // Use oauth-1.0a library for correct RFC 3986 encoding + HMAC-SHA256 signing
  const oauth = new OAuth({
    consumer: { key: consumerKey, secret: consumerSecret },
    signature_method: 'HMAC-SHA256',
    hash_function(base_string, key) {
      return crypto.createHmac('sha256', key).update(base_string).digest('base64');
    },
  });

  // Pass baseUrl + raw queryParams separately so oauth-1.0a handles encoding
  // (passing fullUrl causes double-encoding of already-encoded query strings)
  const authData = oauth.authorize(
    { url: baseUrl, method: req.method, data: Object.keys(queryParams).length ? queryParams : null },
    { key: tokenId, secret: tokenSecret }
  );

  // Build Authorization header and prepend the required realm
  const oauthHeader = oauth.toHeader(authData);
  const authHeader = oauthHeader.Authorization.replace(
    'OAuth ',
    `OAuth realm="${accountId}", `
  );

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    };

    if (['POST', 'PATCH', 'PUT'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const nsRes = await fetch(fullUrl, fetchOptions);
    const text = await nsRes.text();

    console.log('NS URL:', fullUrl);
    console.log('NS Status:', nsRes.status);
    console.log('NS Response:', text);

    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    // Include debug info on errors so we can diagnose
    if (!nsRes.ok) {
      data._debug = { url: fullUrl, status: nsRes.status };
    }

    res.status(nsRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
