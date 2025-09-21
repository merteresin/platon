'use client';
import { useEffect, useState } from 'react';
import { api } from '@/app/lib/api';

type L = { id:number; name:string; symbol:string; price:number; status:string };

export default function LaunchesPage() {
  const [rows, setRows] = useState<L[]>([]);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        const out = await api('/api/launches');
        setRows(out?.launches ?? []);
      } catch (e: any) { setErr(e?.message || 'Hata'); }
    })();
  }, []);

  if (err) return <p style={{color:'crimson'}}>Veri alınamadı: {err}</p>;
  return (
    <div style={{maxWidth:800, margin:'20px auto'}}>
      <h1>Launches</h1>
      <ul>
        {rows.map((x, i) => <li key={i}>{x.name} ({x.symbol}) — Fiyat: {x.price} — {x.status}</li>)}
      </ul>
    </div>
  );
}
