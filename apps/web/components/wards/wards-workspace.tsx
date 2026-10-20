'use client';

import { useEffect, useState } from 'react';
import { hospitalApi } from '@/lib/api';
import type { Ward } from '@/types/hospital';
import { wardColor } from '@/components/dashboard/dashboard-workspace';

export function WardsWorkspace({ canEdit }: { canEdit: boolean }) {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    hospitalApi
      .wards()
      .then(setWards)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const adjust = async (ward: Ward, delta: number) => {
    const next = ward.occupiedBeds + delta;
    if (next < 0 || next > ward.totalBeds) return;
    setSaving(ward.id);
    setError('');
    try {
      const updated = await hospitalApi.updateWardOccupancy(ward.id, next);
      setWards((list) => list.map((w) => (w.id === updated.id ? updated : w)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const total = wards.reduce((s, w) => s + w.totalBeds, 0);
  const occupied = wards.reduce((s, w) => s + w.occupiedBeds, 0);

  return (
    <>
      <div className="zm-kpis">
        <div className="zm-k"><small>Wards</small><b>{wards.length}</b></div>
        <div className="zm-k"><small>Total beds</small><b>{total}</b></div>
        <div className="zm-k"><small>Occupied</small><b>{occupied}</b></div>
        <div className="zm-k">
          <small>Free beds</small>
          <b>{total - occupied}<em className="up">{total ? Math.round((occupied / total) * 100) : 0}% full</em></b>
        </div>
      </div>
      {error && <p className="zm-err">{error}</p>}
      {loading ? (
        <p className="zm-empty">Loading wards…</p>
      ) : (
        <div className="zm-wards">
          {wards.map((w) => {
            const pct = w.totalBeds ? Math.round((w.occupiedBeds / w.totalBeds) * 100) : 0;
            return (
              <div className="zm-card" key={w.id}>
                <div className="zm-ch" style={{ marginBottom: 0 }}>
                  <b>{w.name}</b>
                  <span>{w.totalBeds - w.occupiedBeds} free</span>
                </div>
                <div className="big">{pct}%<i>{w.occupiedBeds} of {w.totalBeds} beds</i></div>
                <span className="zm-bar"><i style={{ width: `${pct}%`, background: wardColor(pct) }} /></span>
                {canEdit && (
                  <div className="zm-step">
                    <button type="button" aria-label={`Discharge from ${w.name}`} disabled={saving === w.id || w.occupiedBeds === 0} onClick={() => adjust(w, -1)}>−</button>
                    <button type="button" aria-label={`Admit to ${w.name}`} disabled={saving === w.id || w.occupiedBeds >= w.totalBeds} onClick={() => adjust(w, 1)}>+</button>
                    <span className="zm-empty" style={{ padding: 0 }}>Admit / discharge</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
