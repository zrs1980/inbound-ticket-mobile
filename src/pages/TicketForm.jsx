import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getTicket,
  getTicketLines,
  createTicket,
  updateTicket,
  createTicketLine,
  updateTicketLine,
  deleteTicketLine,
  searchVendors,
  searchItems,
  searchLocations,
  getPurchaseOrders,
} from '../services/netsuiteApi';
import LookupField from '../components/LookupField';

const EMPTY_LINE = {
  id: null,
  item: null,
  custrecord_looperp_inb_tckt_ln_dscption: '',
  custrecord_looperp_inb_tckt_ln_qty: '',
  custrecord_looperp_inb_tckt_ln_uom: '',
  custrecord_looperp_inb_tckt_ln_unt_price: '',
  custrecord_looperp_inb_tckt_ln_net_lbs: '',
  custrecord_looperp_inb_tckt_ln_gr_1_lbs: '',
  custrecord_looperp_inb_tckt_ln_tr_1_lbs: '',
};

function emptyHeader() {
  return {
    custrecord_looperp_inb_tckt_date: new Date().toISOString().split('T')[0],
    custrecord_looperp_inb_tckt_driver_name: '',
    custrecord_looperp_inb_tckt_plate_number: '',
    custrecord_looperp_inb_tckt_trailer_num: '',
    custrecord_looperp_inb_tckt_seal_number: '',
    custrecord_looperp_inb_tckt_cont_num: '',
    custrecord_looperp_inb_tckt_manifest_num: '',
    custrecord_looperp_ibticket_del_num: '',
    custrecord_looperp_inb_tckt_carrier_num: '',
    custrecord_looperp_inb_tckt_carrier_info: '',
    custrecord_looperp_inb_tckt_miles: '',
    custrecord_looperp_inb_tckt_gross_tot: '',
    custrecord_looperp_inb_tckt_tare_tot: '',
    custrecord_looperp_inb_tckt_net_tot: '',
    custrecord_looperp_inb_tckt_net_tons: '',
    custrecord_looperp_inb_tckt_do_not_accpt: false,
    custrecord_looperp_inb_tckt_load_rejectc: false,
    custrecord_looperp_inb_tckt_insp_notes: '',
    custrecord_looperp_inb_tckt_non_conform: '',
    custrecord_looperp_inb_tckt_sup_notes: '',
    // lookup refs
    supplier: null,
    carrier: null,
    location: null,
    custrecord_looperp_inb_tckt_po: null,
    custrecord_looperp_inb_tckt_status: null,
  };
}

export default function TicketForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [header, setHeader] = useState(emptyHeader());
  const [lines, setLines] = useState([{ ...EMPTY_LINE, _tempId: Date.now() }]);
  const [deletedLineIds, setDeletedLineIds] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('header');

  useEffect(() => {
    if (!isEdit) return;
    async function load() {
      try {
        const [ticket, linesData] = await Promise.all([
          getTicket(id),
          getTicketLines(id),
        ]);

        setHeader({
          custrecord_looperp_inb_tckt_date: ticket.custrecord_looperp_inb_tckt_date || '',
          custrecord_looperp_inb_tckt_driver_name: ticket.custrecord_looperp_inb_tckt_driver_name || '',
          custrecord_looperp_inb_tckt_plate_number: ticket.custrecord_looperp_inb_tckt_plate_number || '',
          custrecord_looperp_inb_tckt_trailer_num: ticket.custrecord_looperp_inb_tckt_trailer_num || '',
          custrecord_looperp_inb_tckt_seal_number: ticket.custrecord_looperp_inb_tckt_seal_number || '',
          custrecord_looperp_inb_tckt_cont_num: ticket.custrecord_looperp_inb_tckt_cont_num || '',
          custrecord_looperp_inb_tckt_manifest_num: ticket.custrecord_looperp_inb_tckt_manifest_num || '',
          custrecord_looperp_ibticket_del_num: ticket.custrecord_looperp_ibticket_del_num || '',
          custrecord_looperp_inb_tckt_carrier_num: ticket.custrecord_looperp_inb_tckt_carrier_num || '',
          custrecord_looperp_inb_tckt_carrier_info: ticket.custrecord_looperp_inb_tckt_carrier_info || '',
          custrecord_looperp_inb_tckt_miles: ticket.custrecord_looperp_inb_tckt_miles ?? '',
          custrecord_looperp_inb_tckt_gross_tot: ticket.custrecord_looperp_inb_tckt_gross_tot ?? '',
          custrecord_looperp_inb_tckt_tare_tot: ticket.custrecord_looperp_inb_tckt_tare_tot ?? '',
          custrecord_looperp_inb_tckt_net_tot: ticket.custrecord_looperp_inb_tckt_net_tot ?? '',
          custrecord_looperp_inb_tckt_net_tons: ticket.custrecord_looperp_inb_tckt_net_tons ?? '',
          custrecord_looperp_inb_tckt_do_not_accpt: ticket.custrecord_looperp_inb_tckt_do_not_accpt || false,
          custrecord_looperp_inb_tckt_load_rejectc: ticket.custrecord_looperp_inb_tckt_load_rejectc || false,
          custrecord_looperp_inb_tckt_insp_notes: ticket.custrecord_looperp_inb_tckt_insp_notes || '',
          custrecord_looperp_inb_tckt_non_conform: ticket.custrecord_looperp_inb_tckt_non_conform || '',
          custrecord_looperp_inb_tckt_sup_notes: ticket.custrecord_looperp_inb_tckt_sup_notes || '',
          supplier: ticket.custrecord_looperp_inb_tckt_supplier
            ? { id: ticket.custrecord_looperp_inb_tckt_supplier.id, name: ticket.custrecord_looperp_inb_tckt_supplier.refName }
            : null,
          carrier: ticket.custrecord_looperp_inb_tckt_carrier
            ? { id: ticket.custrecord_looperp_inb_tckt_carrier.id, name: ticket.custrecord_looperp_inb_tckt_carrier.refName }
            : null,
          location: ticket.custrecord_looperp_inb_tckt_location
            ? { id: ticket.custrecord_looperp_inb_tckt_location.id, name: ticket.custrecord_looperp_inb_tckt_location.refName }
            : null,
          custrecord_looperp_inb_tckt_po: ticket.custrecord_looperp_inb_tckt_po
            ? { id: ticket.custrecord_looperp_inb_tckt_po.id, name: ticket.custrecord_looperp_inb_tckt_po.refName }
            : null,
          custrecord_looperp_inb_tckt_status: ticket.custrecord_looperp_inb_tckt_status
            ? { id: ticket.custrecord_looperp_inb_tckt_status.id, name: ticket.custrecord_looperp_inb_tckt_status.refName }
            : null,
        });

        const loadedLines = (linesData.items || []).map((ln) => ({
          id: ln.id,
          item: ln.custrecord_looperp_inb_tckt_ln_item
            ? { id: ln.custrecord_looperp_inb_tckt_ln_item, name: ln.custrecord_looperp_inb_tckt_ln_item }
            : null,
          custrecord_looperp_inb_tckt_ln_dscption: ln.custrecord_looperp_inb_tckt_ln_dscption || '',
          custrecord_looperp_inb_tckt_ln_qty: ln.custrecord_looperp_inb_tckt_ln_qty ?? '',
          custrecord_looperp_inb_tckt_ln_uom: ln.custrecord_looperp_inb_tckt_ln_uom || '',
          custrecord_looperp_inb_tckt_ln_unt_price: ln.custrecord_looperp_inb_tckt_ln_unt_price ?? '',
          custrecord_looperp_inb_tckt_ln_net_lbs: ln.custrecord_looperp_inb_tckt_ln_net_lbs ?? '',
          custrecord_looperp_inb_tckt_ln_gr_1_lbs: ln.custrecord_looperp_inb_tckt_ln_gr_1_lbs ?? '',
          custrecord_looperp_inb_tckt_ln_tr_1_lbs: ln.custrecord_looperp_inb_tckt_ln_tr_1_lbs ?? '',
          _tempId: Date.now() + Math.random(),
        }));
        setLines(loadedLines.length ? loadedLines : [{ ...EMPTY_LINE, _tempId: Date.now() }]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isEdit]);

  function setHeaderField(key, value) {
    setHeader((h) => ({ ...h, [key]: value }));
  }

  function setLineField(idx, key, value) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  }

  function addLine() {
    setLines((ls) => [...ls, { ...EMPTY_LINE, _tempId: Date.now() }]);
  }

  function removeLine(idx) {
    const line = lines[idx];
    if (line.id) setDeletedLineIds((ids) => [...ids, line.id]);
    setLines((ls) => ls.filter((_, i) => i !== idx));
  }

  function buildHeaderPayload() {
    const h = header;
    const payload = {
      custrecord_looperp_inb_tckt_date: h.custrecord_looperp_inb_tckt_date || null,
      custrecord_looperp_inb_tckt_driver_name: h.custrecord_looperp_inb_tckt_driver_name || null,
      custrecord_looperp_inb_tckt_plate_number: h.custrecord_looperp_inb_tckt_plate_number || null,
      custrecord_looperp_inb_tckt_trailer_num: h.custrecord_looperp_inb_tckt_trailer_num || null,
      custrecord_looperp_inb_tckt_seal_number: h.custrecord_looperp_inb_tckt_seal_number || null,
      custrecord_looperp_inb_tckt_cont_num: h.custrecord_looperp_inb_tckt_cont_num || null,
      custrecord_looperp_inb_tckt_manifest_num: h.custrecord_looperp_inb_tckt_manifest_num || null,
      custrecord_looperp_ibticket_del_num: h.custrecord_looperp_ibticket_del_num || null,
      custrecord_looperp_inb_tckt_carrier_num: h.custrecord_looperp_inb_tckt_carrier_num || null,
      custrecord_looperp_inb_tckt_carrier_info: h.custrecord_looperp_inb_tckt_carrier_info || null,
      custrecord_looperp_inb_tckt_miles: h.custrecord_looperp_inb_tckt_miles !== '' ? Number(h.custrecord_looperp_inb_tckt_miles) : null,
      custrecord_looperp_inb_tckt_gross_tot: h.custrecord_looperp_inb_tckt_gross_tot !== '' ? Number(h.custrecord_looperp_inb_tckt_gross_tot) : null,
      custrecord_looperp_inb_tckt_tare_tot: h.custrecord_looperp_inb_tckt_tare_tot !== '' ? Number(h.custrecord_looperp_inb_tckt_tare_tot) : null,
      custrecord_looperp_inb_tckt_net_tot: h.custrecord_looperp_inb_tckt_net_tot !== '' ? Number(h.custrecord_looperp_inb_tckt_net_tot) : null,
      custrecord_looperp_inb_tckt_net_tons: h.custrecord_looperp_inb_tckt_net_tons !== '' ? Number(h.custrecord_looperp_inb_tckt_net_tons) : null,
      custrecord_looperp_inb_tckt_do_not_accpt: h.custrecord_looperp_inb_tckt_do_not_accpt,
      custrecord_looperp_inb_tckt_load_rejectc: h.custrecord_looperp_inb_tckt_load_rejectc,
      custrecord_looperp_inb_tckt_insp_notes: h.custrecord_looperp_inb_tckt_insp_notes || null,
      custrecord_looperp_inb_tckt_non_conform: h.custrecord_looperp_inb_tckt_non_conform || null,
      custrecord_looperp_inb_tckt_sup_notes: h.custrecord_looperp_inb_tckt_sup_notes || null,
    };
    if (h.supplier) payload.custrecord_looperp_inb_tckt_supplier = { id: h.supplier.id };
    if (h.carrier) payload.custrecord_looperp_inb_tckt_carrier = { id: h.carrier.id };
    if (h.location) payload.custrecord_looperp_inb_tckt_location = { id: h.location.id };
    if (h.custrecord_looperp_inb_tckt_po) payload.custrecord_looperp_inb_tckt_po = { id: h.custrecord_looperp_inb_tckt_po.id };
    return payload;
  }

  function buildLinePayload(line, ticketId) {
    return {
      custrecord_looperp_inb_tckt_ln_inb_tckt: { id: String(ticketId) },
      custrecord_looperp_inb_tckt_ln_dscption: line.custrecord_looperp_inb_tckt_ln_dscption || null,
      custrecord_looperp_inb_tckt_ln_qty: line.custrecord_looperp_inb_tckt_ln_qty !== '' ? Number(line.custrecord_looperp_inb_tckt_ln_qty) : null,
      custrecord_looperp_inb_tckt_ln_uom: line.custrecord_looperp_inb_tckt_ln_uom || null,
      custrecord_looperp_inb_tckt_ln_unt_price: line.custrecord_looperp_inb_tckt_ln_unt_price !== '' ? Number(line.custrecord_looperp_inb_tckt_ln_unt_price) : null,
      custrecord_looperp_inb_tckt_ln_net_lbs: line.custrecord_looperp_inb_tckt_ln_net_lbs !== '' ? Number(line.custrecord_looperp_inb_tckt_ln_net_lbs) : null,
      custrecord_looperp_inb_tckt_ln_gr_1_lbs: line.custrecord_looperp_inb_tckt_ln_gr_1_lbs !== '' ? Number(line.custrecord_looperp_inb_tckt_ln_gr_1_lbs) : null,
      custrecord_looperp_inb_tckt_ln_tr_1_lbs: line.custrecord_looperp_inb_tckt_ln_tr_1_lbs !== '' ? Number(line.custrecord_looperp_inb_tckt_ln_tr_1_lbs) : null,
      ...(line.item ? { custrecord_looperp_inb_tckt_ln_item: { id: line.item.id } } : {}),
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      let ticketId = id;

      if (isEdit) {
        await updateTicket(id, buildHeaderPayload());
      } else {
        const res = await createTicket(buildHeaderPayload());
        // NetSuite returns the new record ID in the Location header; extract from response
        ticketId = res.id || res.internalId;
        if (!ticketId) throw new Error('Ticket created but no ID returned. Check NetSuite.');
      }

      // Delete removed lines
      await Promise.all(deletedLineIds.map((lid) => deleteTicketLine(lid)));

      // Save lines
      await Promise.all(
        lines.map((line) => {
          if (line.id) return updateTicketLine(line.id, buildLinePayload(line, ticketId));
          return createTicketLine(buildLinePayload(line, ticketId));
        })
      );

      navigate(ticketId ? `/tickets/${ticketId}` : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading ticket...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-700 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
        <h1 className="text-lg font-semibold flex-1">{isEdit ? 'Edit Ticket' : 'New Ticket'}</h1>
        <button
          form="ticket-form"
          type="submit"
          disabled={saving}
          className="bg-white text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </header>

      {error && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('header')}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'header' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500'}`}
        >
          Header
        </button>
        <button
          onClick={() => setActiveTab('lines')}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'lines' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500'}`}
        >
          Lines ({lines.length})
        </button>
      </div>

      <form id="ticket-form" onSubmit={handleSubmit}>
        {activeTab === 'header' && (
          <div className="p-4 space-y-4 max-w-lg mx-auto">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={header.custrecord_looperp_inb_tckt_date}
                onChange={(e) => setHeaderField('custrecord_looperp_inb_tckt_date', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Supplier */}
            <LookupField
              label="Supplier"
              value={header.supplier}
              onChange={(v) => setHeaderField('supplier', v)}
              searchFn={searchVendors}
              placeholder="Search supplier..."
            />

            {/* Carrier */}
            <LookupField
              label="Carrier"
              value={header.carrier}
              onChange={(v) => setHeaderField('carrier', v)}
              searchFn={searchVendors}
              placeholder="Search carrier..."
            />

            {/* Location */}
            <LookupField
              label="Location"
              value={header.location}
              onChange={(v) => setHeaderField('location', v)}
              searchFn={searchLocations}
              placeholder="Search location..."
            />

            {/* PO */}
            <LookupField
              label="Purchase Order"
              value={header.custrecord_looperp_inb_tckt_po}
              onChange={(v) => setHeaderField('custrecord_looperp_inb_tckt_po', v)}
              searchFn={getPurchaseOrders}
              placeholder="Search PO..."
            />

            {/* Text fields */}
            {[
              { key: 'custrecord_looperp_inb_tckt_driver_name', label: 'Driver Name' },
              { key: 'custrecord_looperp_inb_tckt_plate_number', label: 'Plate #' },
              { key: 'custrecord_looperp_inb_tckt_trailer_num', label: 'Trailer #' },
              { key: 'custrecord_looperp_inb_tckt_seal_number', label: 'Seal Number' },
              { key: 'custrecord_looperp_inb_tckt_cont_num', label: 'Container #' },
              { key: 'custrecord_looperp_inb_tckt_manifest_num', label: 'Supplier Manifest #' },
              { key: 'custrecord_looperp_ibticket_del_num', label: 'Delivery Number' },
              { key: 'custrecord_looperp_inb_tckt_carrier_num', label: 'Carrier #' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="text"
                  value={header[key]}
                  onChange={(e) => setHeaderField(key, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            {/* Weight fields */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'custrecord_looperp_inb_tckt_gross_tot', label: 'Gross (lbs)' },
                { key: 'custrecord_looperp_inb_tckt_tare_tot', label: 'Tare (lbs)' },
                { key: 'custrecord_looperp_inb_tckt_net_tot', label: 'Net (lbs)' },
                { key: 'custrecord_looperp_inb_tckt_net_tons', label: 'Net Tons' },
                { key: 'custrecord_looperp_inb_tckt_miles', label: 'Miles' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="number"
                    step="any"
                    value={header[key]}
                    onChange={(e) => setHeaderField(key, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            {/* Checkboxes */}
            <div className="flex gap-6">
              {[
                { key: 'custrecord_looperp_inb_tckt_do_not_accpt', label: 'Do Not Accept' },
                { key: 'custrecord_looperp_inb_tckt_load_rejectc', label: 'Load Rejected' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={header[key]}
                    onChange={(e) => setHeaderField(key, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  {label}
                </label>
              ))}
            </div>

            {/* Notes */}
            {[
              { key: 'custrecord_looperp_inb_tckt_insp_notes', label: 'Inspection Notes' },
              { key: 'custrecord_looperp_inb_tckt_non_conform', label: 'Non-Conformance Notes' },
              { key: 'custrecord_looperp_inb_tckt_sup_notes', label: 'Supplier Notes' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <textarea
                  rows={3}
                  value={header[key]}
                  onChange={(e) => setHeaderField(key, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'lines' && (
          <div className="p-4 space-y-4 max-w-lg mx-auto">
            {lines.map((line, idx) => (
              <div key={line._tempId || line.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Line {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="text-red-400 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <LookupField
                  label="Item"
                  value={line.item}
                  onChange={(v) => setLineField(idx, 'item', v)}
                  searchFn={searchItems}
                  placeholder="Search item..."
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={line.custrecord_looperp_inb_tckt_ln_dscption}
                    onChange={(e) => setLineField(idx, 'custrecord_looperp_inb_tckt_ln_dscption', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'custrecord_looperp_inb_tckt_ln_qty', label: 'QTY' },
                    { key: 'custrecord_looperp_inb_tckt_ln_uom', label: 'UOM', text: true },
                    { key: 'custrecord_looperp_inb_tckt_ln_unt_price', label: 'Unit Price' },
                    { key: 'custrecord_looperp_inb_tckt_ln_gr_1_lbs', label: 'Gross (lbs)' },
                    { key: 'custrecord_looperp_inb_tckt_ln_tr_1_lbs', label: 'Tare (lbs)' },
                    { key: 'custrecord_looperp_inb_tckt_ln_net_lbs', label: 'Net (lbs)' },
                  ].map(({ key, label, text }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <input
                        type={text ? 'text' : 'number'}
                        step="any"
                        value={line[key]}
                        onChange={(e) => setLineField(idx, key, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addLine}
              className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl text-sm font-medium"
            >
              + Add Line
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
