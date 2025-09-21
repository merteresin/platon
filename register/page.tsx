'use client';
import { useState } from 'react';
import { api } from '@/app/lib/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const out = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, username })
      });
      if (out?.token) localStorage.setItem('token', out.token);
      setOk(true);
      setTimeout(() => (window.location.href = '/dashboard'), 600);
    } catch (err: any) {
      setError(err?.message || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{maxWidth: 420, margin: '40px auto'}}>
      <h1>Üye Ol</h1>
      <form onSubmit={onSubmit}>
        <label>E-posta</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} required type="email" placeholder="mail@site.com" />
        <label>Şifre</label>
        <input value={password} onChange={e=>setPassword(e.target.value)} required type="password" placeholder="••••••" />
        <label>Kullanıcı adı (opsiyonel)</label>
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="İsterseniz" />
        <button type="submit" disabled={loading}>{loading ? 'Gönderiliyor...' : 'Üye Ol'}</button>
      </form>
      {error && <p style={{color:'crimson', marginTop:12}}>{error}</p>}
      {ok && <p style={{color:'green', marginTop:12}}>Kayıt başarılı, yönlendiriliyorsunuz…</p>}
    </div>
  );
}
