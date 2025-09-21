'use client';
import { useEffect, useState } from 'react';
import { api } from '@/app/lib/api';

type Bal = { currency: string; balance: number };

export default function WalletBalance() {
  const [balances, setBalances] = useState<Bal[]>([]);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        const out = await api('/api/users/balance');
        setBalances(out?.balances ?? []);
      } catch (e: any) {
        setErr(e?.message || 'Hata');
      }
    })();
  }, []);

  if (err) return <p style={{color:'crimson'}}>Bakiye alınamadı: {err}</p>;
  return (
    <div>
      <h3>Cüzdan Bakiyesi</h3>
      <ul>
        {balances.map((b, i) => (
          <li key={i}>{b.currency}: {b.balance}</li>
        ))}
      </ul>
    </div>
  );
}
