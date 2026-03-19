import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTicket, getTicketLines } from '../services/netsuiteApi';

function Field({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-40">{label}</span>
      <span className="text-sm text-gray-900 text-right">{String(value)}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  );
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [t, l] = await Promise.all([getTicket(id), getTicketLines(id)]);
        setTicket(t);
        setLines(l.items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      </div>
    );
  }

  const t = ticket;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
        <h1 className="text-lg font-semibold flex-1">{t.name || `Ticket #${id}`}</h1>
        <button
          onClick={() => navigate(`/tickets/${id}/edit`)}
          className="bg-white text-blue-700 text-sm font-semibold px-3 py-1 rounded-full"
        >
          Edit
        </button>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        {/* Status badges */}
        <div className="flex gap-2 mb-4">
          {t.custrecord_looperp_inb_tckt_status?.refName && (
            <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
              {t.custrecord_looperp_inb_tckt_status.refName}
            </span>
          )}
          {t.custrecord_looperp_inb_tckt_do_not_accpt && (
            <span className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">Do Not Accept</span>
          )}
          {t.custrecord_looperp_inb_tckt_load_rejectc && (
            <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">Load Rejected</span>
          )}
        </div>

        <Section title="General">
          <Field label="Date" value={t.custrecord_looperp_inb_tckt_date} />
          <Field label="Supplier" value={t.custrecord_looperp_inb_tckt_supplier?.refName} />
          <Field label="Location" value={t.custrecord_looperp_inb_tckt_location?.refName} />
          <Field label="PO" value={t.custrecord_looperp_inb_tckt_po?.refName} />
          <Field label="Delivery #" value={t.custrecord_looperp_ibticket_del_num} />
          <Field label="Manifest #" value={t.custrecord_looperp_inb_tckt_manifest_num} />
        </Section>

        <Section title="Driver / Vehicle">
          <Field label="Driver" value={t.custrecord_looperp_inb_tckt_driver_name} />
          <Field label="Plate #" value={t.custrecord_looperp_inb_tckt_plate_number} />
          <Field label="Trailer #" value={t.custrecord_looperp_inb_tckt_trailer_num} />
          <Field label="Seal #" value={t.custrecord_looperp_inb_tckt_seal_number} />
          <Field label="Container #" value={t.custrecord_looperp_inb_tckt_cont_num} />
          <Field label="Carrier" value={t.custrecord_looperp_inb_tckt_carrier?.refName} />
          <Field label="Carrier #" value={t.custrecord_looperp_inb_tckt_carrier_num} />
          <Field label="Miles" value={t.custrecord_looperp_inb_tckt_miles} />
        </Section>

        <Section title="Weights">
          <Field label="Gross (lbs)" value={t.custrecord_looperp_inb_tckt_gross_tot?.toLocaleString()} />
          <Field label="Tare (lbs)" value={t.custrecord_looperp_inb_tckt_tare_tot?.toLocaleString()} />
          <Field label="Net (lbs)" value={t.custrecord_looperp_inb_tckt_net_tot?.toLocaleString()} />
          <Field label="Net Tons" value={t.custrecord_looperp_inb_tckt_net_tons} />
        </Section>

        {(t.custrecord_looperp_inb_tckt_insp_notes || t.custrecord_looperp_inb_tckt_non_conform || t.custrecord_looperp_inb_tckt_sup_notes) && (
          <Section title="Notes">
            <Field label="Inspection" value={t.custrecord_looperp_inb_tckt_insp_notes} />
            <Field label="Non-Conformance" value={t.custrecord_looperp_inb_tckt_non_conform} />
            <Field label="Supplier Notes" value={t.custrecord_looperp_inb_tckt_sup_notes} />
          </Section>
        )}

        {/* Lines */}
        {lines.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Lines ({lines.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {lines.map((ln, i) => (
                <div key={ln.id} className="px-4 py-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      Line {i + 1}{ln.custrecord_looperp_inb_tckt_ln_dscption ? ` — ${ln.custrecord_looperp_inb_tckt_ln_dscption}` : ''}
                    </span>
                    {ln.custrecord_looperp_inb_tckt_ln_ext_price != null && (
                      <span className="text-sm font-semibold text-gray-900">
                        ${Number(ln.custrecord_looperp_inb_tckt_ln_ext_price).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    {ln.custrecord_looperp_inb_tckt_ln_qty != null && (
                      <p>QTY: {ln.custrecord_looperp_inb_tckt_ln_qty} {ln.custrecord_looperp_inb_tckt_ln_uom || ''}</p>
                    )}
                    {ln.custrecord_looperp_inb_tckt_ln_net_lbs != null && (
                      <p>Net: {Number(ln.custrecord_looperp_inb_tckt_ln_net_lbs).toLocaleString()} lbs &nbsp;|&nbsp;
                        Gross: {Number(ln.custrecord_looperp_inb_tckt_ln_gr_1_lbs || 0).toLocaleString()} lbs &nbsp;|&nbsp;
                        Tare: {Number(ln.custrecord_looperp_inb_tckt_ln_tr_1_lbs || 0).toLocaleString()} lbs
                      </p>
                    )}
                    {ln.custrecord_looperp_inb_tckt_ln_unt_price != null && (
                      <p>Unit Price: ${ln.custrecord_looperp_inb_tckt_ln_unt_price}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
