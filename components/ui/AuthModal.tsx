'use client';

import { useState } from 'react';

interface AuthModalProps {
  onSuccess: (user: { id: number; username: string; role: string }) => void;
}

export default function AuthModal({ onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { username, password }
        : { username, email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        onSuccess(data.user);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-black tracking-tight text-slate-900">
            MARCH <span className="text-orange-500">MADNESS</span>
          </div>
          <div className="text-sm text-slate-400 mt-1">Bracket Pool</div>
        </div>

        {/* Mode switcher */}
        <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                mode === m
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoFocus
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />

          {mode === 'register' && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 mt-1"
          >
            {loading ? 'Loading…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
