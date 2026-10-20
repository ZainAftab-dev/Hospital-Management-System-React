'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { hospitalApi } from '@/lib/api';
import type { Appointment, Dispensation, Doctor, Invoice, Patient, Vital, Ward } from '@/types/hospital';

type DashboardData = {
  patients: Patient[];
  appointments: Appointment[];
  doctors: Doctor[];
  invoices: Invoice[];
  wards: Ward[];
};

type Props = {
  onOpenAppointments: () => void;
  onOpenWards: () => void;
};

const AVATAR_COLORS = ['#3b82c4', '#8b5cf6', '#0e9f8e', '#ef6a55', '#d97706', '#0284c7'];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const STATUS_STYLE: Record<Appointment['status'], { label: string; className?: string; style?: CSSProperties }> = {
  Completed: { label: 'Completed', className: 'up' },
  Confirmed: { label: 'Confirmed', style: { background: '#eef2f6', color: '#6b7a8f' } },
  Pending: { label: 'Pending', style: { background: '#fff4e0', color: '#b7791f' } },
  Cancelled: { label: 'Cancelled', className: 'dn' }
};

export function initials(name: string) {
  const all = name.trim().split(/\s+/);
  const stripped = all.filter((part, i) => !(i === 0 && /^(dr|mr|mrs|ms)\.?$/i.test(part)));
  const parts = stripped.length > 1 ? stripped : all;
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function avatarColor(seed: string) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function wardColor(percent: number) {
  if (percent >= 90) return '#ef6a55';
  if (percent >= 80) return '#f2a93b';
  return '#0e9f8e';
}

function isoDay(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDay(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatMoney(value: number) {
  if (value >= 1_000_000) return `Rs ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `Rs ${(value / 1_000).toFixed(1)}k`;
  return `Rs ${Math.round(value)}`;
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 'new' : '0%';
  const change = Math.round(((current - previous) / previous) * 100);
  return `${change >= 0 ? '+' : ''}${change}%`;
}

/**
 * The dashboard focuses on today. When the clinic has no appointments today
 * (for example on a demo database), it falls back to the most recent day that has
 * appointments and says so in the card title, rather than showing an empty screen.
 */
function pickFocusDay(appointments: Appointment[]) {
  const today = isoDay(new Date());
  const days = Array.from(new Set(appointments.map((a) => a.date))).sort();
  if (days.length === 0 || days.includes(today)) return { day: today, isToday: true };
  const past = days.filter((d) => d < today);
  return { day: past.length ? past[past.length - 1] : days[0], isToday: false };
}

function heartRatePath(values: number[]) {
  if (values.length < 2) return '';
  const min = Math.min(...values) - 4;
  const max = Math.max(...values) + 4;
  const step = 200 / (values.length - 1);
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)} ${(36 - ((v - min) / (max - min)) * 32).toFixed(1)}`)
    .join(' ');
}

export function DashboardWorkspace({ onOpenAppointments, onOpenWards }: Props) {
  const [data, setData] = useState<DashboardData>({ patients: [], appointments: [], doctors: [], invoices: [], wards: [] });
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [rx, setRx] = useState<Dispensation | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Each list is fetched independently so a role without access to one module
    // (e.g. Staff and billing) still gets the rest of the dashboard.
    Promise.allSettled([
      hospitalApi.patients(),
      hospitalApi.appointments(),
      hospitalApi.doctors(),
      hospitalApi.invoices(),
      hospitalApi.wards()
    ]).then(([patients, appointments, doctors, invoices, wards]) => {
      if (cancelled) return;
      const value = <T,>(r: PromiseSettledResult<T[]>) => (r.status === 'fulfilled' ? r.value : []);
      setData({
        patients: value(patients),
        appointments: value(appointments),
        doctors: value(doctors),
        invoices: value(invoices),
        wards: value(wards)
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const view = useMemo(() => {
    const { patients, appointments, doctors, invoices, wards } = data;
    const focus = pickFocusDay(appointments);
    const focusDate = parseDay(focus.day);
    const nowTime = new Date().toTimeString().slice(0, 5);

    const dayAppointments = appointments
      .filter((a) => a.date === focus.day && a.status !== 'Cancelled')
      .sort((a, b) => a.time.localeCompare(b.time));
    const remaining = dayAppointments.filter(
      (a) => a.status !== 'Completed' && (!focus.isToday || a.time >= nowTime)
    ).length;

    const doctorById = new Map(doctors.map((d) => [d.id, d]));
    const patientById = new Map(patients.map((p) => [p.id, p]));

    const totalBeds = wards.reduce((s, w) => s + w.totalBeds, 0);
    const occupiedBeds = wards.reduce((s, w) => s + w.occupiedBeds, 0);
    const occupancy = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const icu = wards.find((w) => /icu|intensive/i.test(w.name));
    const icuFree = icu ? icu.totalBeds - icu.occupiedBeds : null;

    const month = focus.day.slice(0, 7);
    const prevMonthDate = new Date(focusDate.getFullYear(), focusDate.getMonth() - 1, 1);
    const prevMonth = isoDay(prevMonthDate).slice(0, 7);
    const paid = invoices.filter((i) => i.status === 'PAID');
    const revenue = paid.filter((i) => i.date.startsWith(month)).reduce((s, i) => s + i.total, 0);
    const prevRevenue = paid.filter((i) => i.date.startsWith(prevMonth)).reduce((s, i) => s + i.total, 0);

    const critical = patients.filter((p) => p.status === 'Critical' || p.status === 'Emergency').length;

    const monday = new Date(focusDate);
    monday.setDate(focusDate.getDate() - ((focusDate.getDay() + 6) % 7));
    const week = WEEKDAYS.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = isoDay(d);
      return { label, count: appointments.filter((a) => a.date === key && a.status !== 'Cancelled').length };
    });
    const weekMax = Math.max(1, ...week.map((w) => w.count));
    const weekTotal = week.reduce((s, w) => s + w.count, 0);
    const peakIndex = weekTotal ? week.findIndex((w) => w.count === weekMax) : -1;

    const spotlight =
      dayAppointments.find((a) => a.status !== 'Completed' && (!focus.isToday || a.time >= nowTime)) ?? dayAppointments[0];

    return {
      focus,
      dayLabel: focusDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      dayAppointments,
      remaining,
      doctorById,
      patientById,
      occupancy,
      totalBeds,
      occupiedBeds,
      icuFree,
      revenue,
      revenueDelta: percentChange(revenue, prevRevenue),
      monthLabel: focusDate.toLocaleDateString('en-GB', { month: 'short' }),
      critical,
      wards: [...wards].sort((a, b) => b.occupiedBeds / b.totalBeds - a.occupiedBeds / a.totalBeds).slice(0, 5),
      week,
      weekMax,
      weekTotal,
      peakIndex,
      spotlight,
      spotlightPatient: spotlight ? patientById.get(spotlight.patientId) : undefined
    };
  }, [data]);

  const spotlightId = view.spotlight?.patientId;
  useEffect(() => {
    setVitals([]);
    setRx(null);
    if (!spotlightId) return;
    hospitalApi.vitals(spotlightId, 8).then(setVitals).catch(() => setVitals([]));
    hospitalApi
      .dispensations(spotlightId, 1)
      .then((items) => setRx(items[0] ?? null))
      .catch(() => setRx(null));
  }, [spotlightId]);

  const latest = vitals[0];
  const hrSeries = [...vitals].reverse().map((v) => v.heartRate);
  const rxItem = rx?.items[0];
  const spotlight = view.spotlight;
  const sp = view.spotlightPatient;
  const spName = sp?.name ?? spotlight?.patientName ?? '';

  return (
    <>
      <div className="zm-kpis">
        <div className="zm-k">
          <small>Patients</small>
          <b>
            {data.patients.length}
            <em className={view.critical ? 'dn' : 'up'}>{view.critical ? `${view.critical} critical` : 'all stable'}</em>
          </b>
        </div>
        <div className="zm-k">
          <small>{view.focus.isToday ? 'Appointments today' : `Appointments · ${view.dayLabel}`}</small>
          <b>
            {view.dayAppointments.length}
            <em className="up">{view.remaining} left</em>
          </b>
        </div>
        <div className="zm-k">
          <small>Bed occupancy</small>
          <b>
            {view.occupancy}%
            {view.icuFree !== null && (
              <em className={view.icuFree <= 3 ? 'dn' : 'up'}>{view.icuFree} free ICU</em>
            )}
          </b>
        </div>
        <div className="zm-k">
          <small>Revenue · {view.monthLabel}</small>
          <b>
            {formatMoney(view.revenue)}
            <em className={view.revenueDelta.startsWith('-') ? 'dn' : 'up'}>{view.revenueDelta}</em>
          </b>
        </div>
      </div>

      <div className="zm-grid">
        <div className="zm-card">
          <div className="zm-ch">
            <b>{view.focus.isToday ? "Today's appointments" : `Appointments · ${view.dayLabel}`}</b>
            <button type="button" onClick={onOpenAppointments}>View all</button>
          </div>
          {loading && <p className="zm-empty">Loading appointments…</p>}
          {!loading && view.dayAppointments.length === 0 && <p className="zm-empty">No appointments scheduled.</p>}
          {view.dayAppointments.slice(0, 6).map((a) => {
            const status = STATUS_STYLE[a.status];
            const dept = view.doctorById.get(a.doctorId)?.specialization ?? a.doctorName;
            return (
              <div className="zm-ap" key={a.id}>
                <time>{a.time}</time>
                <span className="zm-av" style={{ background: avatarColor(a.patientId) }}>{initials(a.patientName)}</span>
                <span>
                  <b>{a.patientName}</b>
                  <small>{[dept, a.notes || a.type].filter(Boolean).join(' · ')}</small>
                </span>
                <span className={`zm-st ${status.className ?? ''}`} style={status.style}>{status.label}</span>
              </div>
            );
          })}
        </div>

        <div className="zm-card">
          <div className="zm-ch">
            <b>Bed occupancy by ward</b>
            <button type="button" onClick={onOpenWards}>{view.occupiedBeds}/{view.totalBeds} beds</button>
          </div>
          <div className="zm-ward">
            {view.wards.length === 0 && !loading && <p className="zm-empty">No wards configured.</p>}
            {view.wards.map((w) => {
              const pct = w.totalBeds ? Math.round((w.occupiedBeds / w.totalBeds) * 100) : 0;
              return (
                <div key={w.id}>
                  <span>{w.name}</span>
                  <span className="zm-bar"><i style={{ width: `${pct}%`, background: wardColor(pct) }} /></span>
                  <span>{pct}%</span>
                </div>
              );
            })}
          </div>
          <div className="zm-week">
            <div className="zm-ch" style={{ margin: '14px 0 6px' }}>
              <b>Appointments this week</b>
              <span>{view.weekTotal} total</span>
            </div>
            <div className="bars">
              {view.week.map((d, i) => (
                <div key={i} className={i === view.peakIndex ? 'peak' : undefined} title={`${d.count} appointments`}>
                  <i style={{ height: `${(d.count / view.weekMax) * 100}%` }} />
                  <span>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="zm-leg">
            <span><i style={{ background: '#0e9f8e' }} />Normal</span>
            <span><i style={{ background: '#f2a93b' }} />High</span>
            <span><i style={{ background: '#ef6a55' }} />Critical</span>
          </div>
        </div>

        <div className="zm-card">
          {!spotlight ? (
            <p className="zm-empty">{loading ? 'Loading…' : 'No upcoming patient.'}</p>
          ) : (
            <>
              <div className="zm-pt">
                <span className="zm-av" style={{ background: avatarColor(spotlight.patientId) }}>{initials(spName)}</span>
                <span>
                  <b>{spName}</b>
                  <small>
                    ID {spotlight.patientId}
                    {sp ? ` · ${sp.age} y · ${sp.bloodGroup ?? sp.gender}` : ''}
                  </small>
                </span>
              </div>
              <div className="zm-vit">
                <div><small>Heart rate</small><b>{latest ? latest.heartRate : '—'} <i>bpm</i></b></div>
                <div><small>Blood pressure</small><b>{latest ? `${latest.systolic}/${latest.diastolic}` : '—'}</b></div>
                <div><small>SpO₂</small><b>{latest ? latest.spo2 : '—'} <i>%</i></b></div>
                <div><small>Temp</small><b>{latest ? latest.temperatureC.toFixed(1) : '—'} <i>°C</i></b></div>
              </div>
              <div className="zm-ecg">
                <small>
                  <span>Heart rate · last {hrSeries.length || 0} readings</span>
                  <span>
                    {latest
                      ? `● ${new Date(latest.recordedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                      : 'no readings'}
                  </span>
                </small>
                <svg viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
                  {hrSeries.length > 1 && (
                    <path d={heartRatePath(hrSeries)} fill="none" stroke="#2ee6c6" strokeWidth="1.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  )}
                </svg>
              </div>
              <div className="zm-med">
                {rxItem ? (
                  <>
                    <span>Latest Rx · {rxItem.medicine.name} {rxItem.dosage}</span>
                    <small>{rxItem.frequency}</small>
                  </>
                ) : (
                  <>
                    <span>Next visit · {spotlight.doctorName}</span>
                    <small>{spotlight.time}</small>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
