import { useState, useEffect, useRef } from 'react';

export default function LookupField({ label, value, onChange, searchFn, placeholder = 'Search...' }) {
  const [query, setQuery] = useState(value?.name || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = useRef(null);

  useEffect(() => {
    setQuery(value?.name || '');
  }, [value]);

  function handleInput(e) {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);

    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      if (!q) { setResults([]); return; }
      setLoading(true);
      try {
        const data = await searchFn(q);
        setResults(data.items || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function handleSelect(item) {
    setQuery(item.name);
    setOpen(false);
    onChange({ id: item.id, name: item.name });
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    onChange(null);
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-1">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => query && setOpen(true)}
          placeholder={placeholder}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 px-2 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {open && (results.length > 0 || loading) && (
        <div className="absolute z-20 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
          {loading && <p className="text-xs text-gray-400 px-3 py-2">Searching...</p>}
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onMouseDown={() => handleSelect(r)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0"
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
