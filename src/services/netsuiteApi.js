// Frontend service — calls the /api/netsuite Vercel proxy

const BASE = '/api/netsuite';
const RECORD = '/record/v1';
const QUERY = '/query/v1/suiteql';

async function request(method, path, queryParams = {}, body = null, attempt = 1) {
  const url = new URL(BASE, window.location.origin);
  url.searchParams.set('path', path);
  Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v));

  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url.toString(), opts);
  const data = await res.json().catch(() => ({}));

  // Retry once on 401 — fresh nonce/timestamp is generated server-side on each call
  if (res.status === 401 && attempt < 3) {
    return request(method, path, queryParams, body, attempt + 1);
  }

  if (!res.ok) {
    const message = data?.['o:errorDetails']?.[0]?.detail || data?.message || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
}

// ─── Tickets (Header) ───────────────────────────────────────────────────────

export async function getTickets({ query = '', limit = 50, offset = 0 } = {}) {
  const q = query
    ? `SELECT id, name, custrecord_looperp_inb_tckt_date, custrecord_looperp_inb_tckt_supplier, custrecord_looperp_inb_tckt_status, custrecord_looperp_inb_tckt_driver_name, custrecord_looperp_inb_tckt_net_tot FROM customrecord_looperp_inb_tckt WHERE name LIKE '%${query}%' ORDER BY lastmodified DESC OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`
    : `SELECT id, name, custrecord_looperp_inb_tckt_date, custrecord_looperp_inb_tckt_supplier, custrecord_looperp_inb_tckt_status, custrecord_looperp_inb_tckt_driver_name, custrecord_looperp_inb_tckt_net_tot FROM customrecord_looperp_inb_tckt ORDER BY lastmodified DESC OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;

  return request('POST', QUERY, {}, { q });
}

export async function getTicket(id) {
  return request('GET', `${RECORD}/customrecord_looperp_inb_tckt/${id}`, { expandSubResources: 'true' });
}

export async function createTicket(data) {
  return request('POST', `${RECORD}/customrecord_looperp_inb_tckt`, {}, data);
}

export async function updateTicket(id, data) {
  return request('PATCH', `${RECORD}/customrecord_looperp_inb_tckt/${id}`, {}, data);
}

// ─── Ticket Lines ────────────────────────────────────────────────────────────

export async function getTicketLines(ticketId) {
  const q = `SELECT id, name, custrecord_looperp_inb_tckt_ln_item, custrecord_looperp_inb_tckt_ln_dscption, custrecord_looperp_inb_tckt_ln_qty, custrecord_looperp_inb_tckt_ln_uom, custrecord_looperp_inb_tckt_ln_unt_price, custrecord_looperp_inb_tckt_ln_ext_price, custrecord_looperp_inb_tckt_ln_net_lbs, custrecord_looperp_inb_tckt_ln_gr_1_lbs, custrecord_looperp_inb_tckt_ln_tr_1_lbs FROM customrecord_looperp_inb_tckt_ln WHERE custrecord_looperp_inb_tckt_ln_inb_tckt = ${ticketId}`;
  return request('POST', QUERY, {}, { q });
}

export async function createTicketLine(data) {
  return request('POST', `${RECORD}/customrecord_looperp_inb_tckt_ln`, {}, data);
}

export async function updateTicketLine(id, data) {
  return request('PATCH', `${RECORD}/customrecord_looperp_inb_tckt_ln/${id}`, {}, data);
}

export async function deleteTicketLine(id) {
  return request('DELETE', `${RECORD}/customrecord_looperp_inb_tckt_ln/${id}`);
}

// ─── Lookups ─────────────────────────────────────────────────────────────────

export async function searchVendors(query = '') {
  const q = `SELECT id, COALESCE(companyName, entityId) AS name FROM vendor WHERE LOWER(COALESCE(companyName, entityId)) LIKE LOWER('%${query}%') ORDER BY name FETCH NEXT 50 ROWS ONLY`;
  return request('POST', QUERY, {}, { q });
}

export async function searchItems(query = '') {
  const q = `SELECT id, itemId AS name, displayName FROM item WHERE itemId LIKE '%${query}%' ORDER BY itemId FETCH NEXT 50 ROWS ONLY`;
  return request('POST', QUERY, {}, { q });
}

export async function searchLocations(query = '') {
  const q = `SELECT id, name FROM location WHERE name LIKE '%${query}%' ORDER BY name FETCH NEXT 50 ROWS ONLY`;
  return request('POST', QUERY, {}, { q });
}

export async function getPurchaseOrders(vendorId = '') {
  const where = vendorId ? `WHERE entity = ${vendorId}` : '';
  const q = `SELECT id, tranId AS name FROM transaction WHERE type = 'PurchOrd' ${where} ORDER BY tranDate DESC FETCH NEXT 50 ROWS ONLY`;
  return request('POST', QUERY, {}, { q });
}
