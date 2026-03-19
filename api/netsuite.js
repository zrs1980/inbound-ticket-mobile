import crypto from 'crypto';

// RFC 3986 percent-encoding (stricter than encodeURIComponent)
function pct(str) {
  return encodeURIComponent(String(str))
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function buildOAuthHeader({ method, baseUrl, queryParams, accountId, consumerKey, consumerSecret, tokenId, tokenSecret }) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: timestamp,
    oauth_token: tokenId,
    oauth_version: '1.0',
  };

  // Combine oauth params + URL query params for signature
  const allParams = { ...oauthParams, ...queryParams };

  // Sort and encode for signature base string
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${pct(k)}=${pct(allParams[k])}`)
    .join('&');

  const baseString = `${method.toUpperCase()}&${pct(baseUrl)}&${pct(paramString)}`;
  const signingKey = `${pct(consumerSecret)}&${pct(tokenSecret)}`;
  const signature = crypto.createHmac('sha256', signingKey).update(baseString).digest('base64');

  console.log('Base string:', baseString);
  console.log('Signing key:', signingKey);
  console.log('Signature:', signature);

  const headerParts = {
    ...oauthParams,
    oauth_signature: signature,
  };

  // Values in Authorization header are NOT percent-encoded (raw base64 signature kept as-is)
  const headerStr = Object.keys(headerParts)
    .map((k) => `${k}="${headerParts[k]}"`)
    .join(', ');

  // NetSuite requires realm to be uppercase account ID
  return `OAuth realm="${accountId.toUpperCase()}", ${headerStr}`;
}

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

  // Base URL — no query string (used for signature and fetch)
  const baseUrl = `https://${accountId}.suitetalk.api.netsuite.com/services/rest${path}`;

  // Full URL with query params for the actual fetch
  const urlObj = new URL(baseUrl);
  Object.entries(queryParams).forEach(([k, v]) => urlObj.searchParams.set(k, v));
  const fullUrl = urlObj.toString();

  const authHeader = buildOAuthHeader({
    method: req.method,
    baseUrl,
    queryParams,
    accountId,
    consumerKey,
    consumerSecret,
    tokenId,
    tokenSecret,
  });

  console.log('Full URL:', fullUrl);
  console.log('Auth Header:', authHeader);

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        ...(path.includes('/query/v1/suiteql') ? { prefer: 'transient' } : {}),
      },
    };

    if (['POST', 'PATCH', 'PUT'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const nsRes = await fetch(fullUrl, fetchOptions);
    const text = await nsRes.text();

    console.log('NS Status:', nsRes.status);
    console.log('NS Response:', text);

    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!nsRes.ok) {
      data._debug = { url: fullUrl, status: nsRes.status };
    }

    res.status(nsRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
