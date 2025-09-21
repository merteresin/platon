'use client';
import { useEffect, useState } from 'react';
import { api } from '@/app/lib/api';

type Tx = { id: number; type: string; amount: number; currency: string; status: string; created_at: string };

export default function TransactionHistory() {
  const [rows, setRows] = useState<Tx[]>([]);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        const out = await api('/api/transactions');
        setRows(out?.transactions ?? []);
      } catch (e: any) {
        setErr(e?.message || 'Hata');
      }
    })();
  }, []);

  if (err) return <p style={{color:'crimson'}}>İşlemler alınamadı: {err}</p>;
  return (
    <div>
      <h3>İşlem Geçmişi</h3>
      <table>
        <thead><tr><th>ID</th><th>Tür</th><th>Tutar</th><th>Para</th><th>Durum</th><th>Tarih</th></tr></thead>
        <tbody>
          {rows.map(tx => (
            <tr key={tx.id}>
              <td>{tx.id}</td>
              <td>{tx.type}</td>
              <td>{tx.amount}</td>
              <td>{tx.currency}</td>
              <td>{tx.status}</td>
              <td>{new Date(tx.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
