import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    accountId: '',
    consumerKey: '',
    consumerSecret: '',
    tokenId: '',
    tokenSecret: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('ns_credentials') || '{}');
    if (stored.accountId) setForm(stored);
  }, []);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSave(e) {
    e.preventDefault();
    localStorage.setItem('ns_credentials', JSON.stringify(form));
    setSaved(true);
    setTimeout(() => navigate('/'), 1000);
  }

  const fields = [
    { name: 'accountId', label: 'Account ID', placeholder: '1234567' },
    { name: 'consumerKey', label: 'Consumer Key', placeholder: '' },
    { name: 'consumerSecret', label: 'Consumer Secret', placeholder: '' },
    { name: 'tokenId', label: 'Token ID', placeholder: '' },
    { name: 'tokenSecret', label: 'Token Secret', placeholder: '' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
        <h1 className="text-lg font-semibold">NetSuite Settings</h1>
      </header>

      <form onSubmit={handleSave} className="p-4 space-y-4 max-w-lg mx-auto">
        <p className="text-sm text-gray-500">
          Enter your NetSuite Token-Based Authentication credentials. These are stored locally on this device.
        </p>

        {fields.map(({ name, label, placeholder }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type={name.includes('Secret') || name.includes('secret') ? 'password' : 'text'}
              name={name}
              value={form[name]}
              onChange={handleChange}
              placeholder={placeholder}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}

        <button
          type="submit"
          className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm"
        >
          {saved ? 'Saved!' : 'Save Credentials'}
        </button>
      </form>
    </div>
  );
}
