// Vercel serverless function — proxies requests to NetSuite REST API
// with OAuth 1.0a Token-Based Authentication

import crypto from 'crypto';

function generateOAuthSignature({ method, url, params, consumerSecret, tokenSecret }) {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&');

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

  return crypto.createHmac('sha256', signingKey).update(baseString).digest('base64');
}

function buildAuthHeader({ method, url, queryParams = {}, accountId, consumerKey, consumerSecret, tokenId, tokenSecret }) {
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

  const allParams = { ...oauthParams, ...queryParams };

  const signature = generateOAuthSignature({
    method,
    url,
    params: allParams,
    consumerSecret,
    tokenSecret,
  });

  const headerParams = { ...oauthParams, oauth_signature: signature };

  const headerString = Object.keys(headerParams)
    .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(headerParams[k])}"`)
    .join(', ');

  return `OAuth realm="${accountId}", ${headerString}`;
}

export default async function handler(req, res) {
  // Allow CORS from the frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Credentials from Vercel environment variables
  const accountId = process.env.NS_ACCOUNT_ID;
  const consumerKey = process.env.NS_CONSUMER_KEY;
  const consumerSecret = process.env.NS_CONSUMER_SECRET;
  const tokenId = process.env.NS_TOKEN_ID;
  const tokenSecret = process.env.NS_TOKEN_SECRET;

  if (!accountId || !consumerKey || !consumerSecret || !tokenId || !tokenSecret) {
    return res.status(500).json({ error: 'NetSuite credentials not configured on server' });
  }

  // path is passed as a query param: /api/netsuite?path=/customrecord_looperp_inb_tckt
  const { path, ...queryParams } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  const accountIdFormatted = accountId.replace(/-/g, '_').toLowerCase();
  const baseUrl = `https://${accountIdFormatted}.suitetalk.api.netsuite.com/services/rest/record/v1${path}`;

  // Build full URL with query params
  const urlObj = new URL(baseUrl);
  Object.entries(queryParams).forEach(([k, v]) => urlObj.searchParams.set(k, v));
  const fullUrl = urlObj.toString();

  const authHeader = buildAuthHeader({
    method: req.method,
    url: baseUrl,
    queryParams,
    accountId,
    consumerKey,
    consumerSecret,
    tokenId,
    tokenSecret,
  });

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        prefer: 'transient',
      },
    };

    if (['POST', 'PATCH', 'PUT'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const nsRes = await fetch(fullUrl, fetchOptions);
    const contentType = nsRes.headers.get('content-type') || '';
    const text = await nsRes.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    res.status(nsRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
