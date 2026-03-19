import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTickets } from '../services/netsuiteApi';

export default function TicketList() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (q = '') => {
    setLoading(true);
    setError('');
    try {
      const data = await getTickets({ query: q });
      setTickets(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearch(e) {
    e.preventDefault();
    load(query);
  }

  function statusColor(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('complete')) return 'bg-green-100 text-green-800';
    if (s.includes('reject')) return 'bg-red-100 text-red-800';
    if (s.includes('progress') || s.includes('open')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-600';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-700 text-white px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Inbound Tickets</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/tickets/new')}
            className="bg-white text-blue-700 text-sm font-semibold px-3 py-1 rounded-full"
          >
            + New
          </button>
          <button onClick={() => navigate('/settings')} className="text-white opacity-80 text-xl">⚙</button>
        </div>
      </header>

      {/* Search */}
      <form onSubmit={handleSearch} className="px-4 py-3 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ticket name..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Search
        </button>
      </form>

      {/* Content */}
      <div className="px-4 pb-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No tickets found</div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/tickets/${t.id}`)}
                className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name || `#${t.id}`}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.custrecord_looperp_inb_tckt_date || '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Driver: {t.custrecord_looperp_inb_tckt_driver_name || '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {t.custrecord_looperp_inb_tckt_status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(t.custrecord_looperp_inb_tckt_status)}`}>
                        {t.custrecord_looperp_inb_tckt_status}
                      </span>
                    )}
                    {t.custrecord_looperp_inb_tckt_net_tot != null && (
                      <p className="text-sm font-semibold text-gray-700 mt-1">
                        {Number(t.custrecord_looperp_inb_tckt_net_tot).toLocaleString()} lbs
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
