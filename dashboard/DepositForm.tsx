'use client';
import { useState } from 'react';
import { api } from '@/app/lib/api';

export default function DepositForm() {
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState('USDT');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null); setMsg(null);
    try {
      const out = await api('/api/transactions/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(amount), currency })
      });
      setMsg(`Yatırım başarılı. USD kredi: ${out?.credited_usd ?? '—'}`);
    } catch (e: any) {
      setErr(e?.message || 'Hata');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{display:'grid', gap:8}}>
      <h3>Yatırım Yap</h3>
      <label>Tutar</label>
      <input type="number" min="0" step="0.0001" value={amount} onChange={e=>setAmount(parseFloat(e.target.value))} />
      <label>Kripto</label>
      <select value={currency} onChange={e=>setCurrency(e.target.value)}>
        <option>USDT</option>
        <option>TRX</option>
        <option>BTC</option>
        <option>ETH</option>
        <option>BNB</option>
      </select>
      <button type="submit" disabled={loading}>{loading ? 'Gönderiliyor...' : 'Yatır'}</button>
      {msg && <p style={{color:'green'}}>{msg}</p>}
      {err && <p style={{color:'crimson'}}>{err}</p>}
    </form>
  );
}
