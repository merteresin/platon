'use client';
import { useState } from 'react';
import { api } from '@/app/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const out = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (out?.token) localStorage.setItem('token', out.token);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err?.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{maxWidth: 420, margin: '40px auto'}}>
      <h1>Giriş Yap</h1>
      <form onSubmit={onSubmit}>
        <label>E-posta</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} required type="email" placeholder="mail@site.com" />
        <label>Şifre</label>
        <input value={password} onChange={e=>setPassword(e.target.value)} required type="password" placeholder="••••••" />
        <button type="submit" disabled={loading}>{loading ? 'Gönderiliyor...' : 'Giriş Yap'}</button>
      </form>
      {error && <p style={{color:'crimson', marginTop:12}}>{error}</p>}
    </div>
  );
}
