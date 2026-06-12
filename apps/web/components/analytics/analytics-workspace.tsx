'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  appointments as initialAppointments,
  doctors as initialDoctors,
  invoices as initialInvoices,
  medicines as initialMedicines,
  patients as initialPatients
} from '@/lib/mock-data';
import { hospitalApi } from '@/lib/api';
import { formatRupees } from '@/lib/utils';
import type { Appointment, Doctor, Invoice, Medicine, Patient } from '@/types/hospital';

export function AnalyticsWorkspace() {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      hospitalApi.patients(),
      hospitalApi.doctors(),
      hospitalApi.appointments(),
      hospitalApi.invoices(),
      hospitalApi.medicines()
    ]).then(([p, d, a, inv, m]) => {
      if (!mounted) return;
      setPatients(p);
      setDoctors(d);
      setAppointments(a);
      setInvoices(inv);
      setMedicines(m);
    }).catch((err) => console.error('Failed to load analytics data', err));
    return () => { mounted = false; };
  }, []);

  const metrics = useMemo(() => {
    const totalPatients = patients.length;
    const totalDoctors = doctors.length;
    const totalAppointments = appointments.length;
    const confirmedAppointments = appointments.filter(a => a.status === 'Confirmed').length;
    const completedAppointments = appointments.filter(a => a.status === 'Completed').length;
    const totalRevenue = invoices.filter(inv => inv.status === 'PAID').reduce((s, inv) => s + inv.total, 0);
    const unpaidRevenue = invoices.filter(inv => inv.status === 'UNPAID').reduce((s, inv) => s + inv.total, 0);
    const avgConsultationFee = doctors.length
      ? doctors.reduce((s, d) => s + Number(d.consultationFee || 0), 0) / doctors.length : 0;
    const lowStockMedicines = medicines.filter(m => m.quantity <= m.reorderLevel).length;

    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const thisMonthRevenue = invoices
      .filter(inv => inv.status === 'PAID' && new Date(inv.date).getMonth() === thisMonth && new Date(inv.date).getFullYear() === thisYear)
      .reduce((s, inv) => s + inv.total, 0);

    return {
      totalPatients, totalDoctors, totalAppointments,
      confirmedAppointments, completedAppointments,
      totalRevenue, unpaidRevenue, thisMonthRevenue,
      avgConsultationFee, lowStockMedicines,
      totalMedicines: medicines.length,
      appointmentCompletionRate: totalAppointments
        ? (((confirmedAppointments + completedAppointments) / totalAppointments) * 100).toFixed(1) : '0.0',
    };
  }, [appointments, doctors, invoices, medicines, patients]);

  const revenueByMonth = useMemo(() => {
    const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
    const now = new Date();

    // Find earliest paid invoice date; fall back to 11 months ago
    let startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    if (paidInvoices.length > 0) {
      const earliest = paidInvoices.reduce<Date>((min, inv) => {
        const d = new Date(inv.date);
        return d < min ? d : min;
      }, new Date(paidInvoices[0].date));
      const earliestMonth = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
      if (earliestMonth < startDate) startDate = earliestMonth;
    }

    const months: { label: string; revenue: number }[] = [];
    const cur = new Date(startDate);
    while (cur.getFullYear() < now.getFullYear() || (cur.getFullYear() === now.getFullYear() && cur.getMonth() <= now.getMonth())) {
      const y = cur.getFullYear();
      const m = cur.getMonth();
      const label = cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const revenue = paidInvoices
        .filter(inv => { const d = new Date(inv.date); return d.getFullYear() === y && d.getMonth() === m; })
        .reduce((s, inv) => s + inv.total, 0);
      months.push({ label, revenue });
      cur.setMonth(cur.getMonth() + 1);
    }

    return months.slice(-12);
  }, [invoices]);

  const departmentStats = useMemo(() => {
    const stats: Record<string, { count: number; doctors: string[] }> = {};
    doctors.forEach(doc => {
      if (!stats[doc.specialization]) stats[doc.specialization] = { count: 0, doctors: [] };
      stats[doc.specialization].count++;
      stats[doc.specialization].doctors.push(doc.name);
    });
    return Object.entries(stats).map(([dept, data]) => ({ department: dept, ...data }));
  }, [doctors]);

  const appointmentStatusBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    appointments.forEach(apt => { breakdown[apt.status] = (breakdown[apt.status] || 0) + 1; });
    return Object.entries(breakdown).map(([status, count]) => ({
      status, count,
      percentage: appointments.length ? ((count / appointments.length) * 100).toFixed(1) : '0.0',
    }));
  }, [appointments]);

  const topDoctors = useMemo(() => {
    const doctorAppts: Record<string, number> = {};
    appointments.forEach(apt => { doctorAppts[apt.doctorName] = (doctorAppts[apt.doctorName] || 0) + 1; });
    return Object.entries(doctorAppts)
      .map(([name, count]) => ({ name, appointments: count }))
      .sort((a, b) => b.appointments - a.appointments)
      .slice(0, 5);
  }, [appointments]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="Total Patients" value={metrics.totalPatients} />
        <MetricCard title="Active Doctors" value={metrics.totalDoctors} />
        <MetricCard
          title="Appointments"
          value={metrics.totalAppointments}
          subtitle={`${metrics.appointmentCompletionRate}% Active/Completed`}
        />
        <MetricCard title="Total Revenue (Paid)" value={formatRupees(metrics.totalRevenue)} subtitle={`${formatRupees(metrics.unpaidRevenue)} outstanding`} />
      </div>

      {/* Revenue Trend Chart */}
      <div className="rounded-lg border border-gray-300 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Revenue Trend — Last {revenueByMonth.length} Month{revenueByMonth.length !== 1 ? 's' : ''}</h3>
          <span className="text-sm text-gray-500">This Month: <strong className="text-gray-800">{formatRupees(metrics.thisMonthRevenue)}</strong></span>
        </div>
        <RevenueTrendChart data={revenueByMonth} />
      </div>

      {/* Pharmacy Status */}
      <div className="rounded-lg p-6 border border-gray-300 bg-white">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pharmacy Status</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Medicines</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{metrics.totalMedicines}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Low Stock Items</p>
            <p className={`text-3xl font-bold mt-2 ${metrics.lowStockMedicines > 5 ? 'text-red-700' : 'text-green-700'}`}>
              {metrics.lowStockMedicines}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Avg Consultation Fee</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">Rs. {metrics.avgConsultationFee.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Department and Appointment Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg p-6 border border-gray-300 bg-white">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Department-wise Doctors</h3>
          <div className="space-y-3">
            {departmentStats.length === 0 && <p className="text-sm text-gray-400">No doctors on record.</p>}
            {departmentStats.map((dept) => (
              <div key={dept.department} className="border-l-4 border-[#5b8ab8] pl-4">
                <p className="font-semibold text-gray-800 capitalize">{dept.department}</p>
                <p className="text-sm text-gray-600">{dept.count} doctor{dept.count !== 1 ? 's' : ''}</p>
                <p className="text-xs text-gray-500 mt-1">{dept.doctors.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-6 border border-gray-300 bg-white">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Appointment Status</h3>
          <div className="space-y-3">
            {appointmentStatusBreakdown.map((item) => {
              const colors: Record<string, string> = {
                Confirmed: 'bg-green-500',
                Pending: 'bg-yellow-400',
                Completed: 'bg-blue-500',
                Cancelled: 'bg-red-500',
              };
              return (
                <div key={item.status}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-semibold text-gray-800">{item.status}</p>
                    <span className="text-sm font-bold text-gray-600">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors[item.status] ?? 'bg-gray-500'}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Doctors */}
      <div className="rounded-lg p-6 border border-gray-300 bg-white">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Doctors by Appointments</h3>
        <div className="space-y-3">
          {topDoctors.length === 0 && <p className="text-sm text-gray-400">No data yet.</p>}
          {topDoctors.map((doctor, index) => (
            <div key={doctor.name} className="flex items-center gap-4 pb-3 border-b border-gray-200 last:border-0">
              <div className="bg-[#5b8ab8] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0">
                #{index + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{doctor.name}</p>
                <p className="text-sm text-gray-600">{doctor.appointments} appointment{doctor.appointments !== 1 ? 's' : ''}</p>
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#5b8ab8] h-2 rounded-full"
                  style={{ width: `${topDoctors[0] ? (doctor.appointments / topDoctors[0].appointments) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hospital Summary */}
      <div className="rounded-lg p-6 border border-gray-300 bg-white">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Hospital Summary</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Avg Appointments/Day</p>
            <p className="text-2xl font-bold text-gray-800">{(metrics.totalAppointments / 30).toFixed(1)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Patient-to-Doctor Ratio</p>
            <p className="text-2xl font-bold text-gray-800">
              {metrics.totalDoctors ? (metrics.totalPatients / metrics.totalDoctors).toFixed(1) : '—'}:1
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Avg Revenue/Day</p>
            <p className="text-2xl font-bold text-gray-800">{formatRupees(metrics.totalRevenue / 30)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Inventory Health</p>
            <p className="text-2xl font-bold text-gray-800">
              {metrics.totalMedicines
                ? ((1 - metrics.lowStockMedicines / metrics.totalMedicines) * 100).toFixed(0)
                : 100}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueTrendChart({ data }: { data: { label: string; revenue: number }[] }) {
  const W = 580;
  const H = 170;
  const pad = { left: 64, right: 16, top: 16, bottom: 32 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const maxRev = Math.max(...data.map(d => d.revenue), 1);

  const pts = data.map((d, i) => ({
    x: pad.left + (data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2),
    y: pad.top + chartH - (d.revenue / maxRev) * chartH,
    ...d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(pad.top + chartH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(pad.top + chartH).toFixed(1)} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 170 }}>
      {yTicks.map((f, i) => {
        const y = pad.top + chartH - f * chartH;
        const val = maxRev * f;
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
              {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="#5b8ab8" fillOpacity="0.10" />
      <path d={linePath} fill="none" stroke="#5b8ab8" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#5b8ab8" stroke="white" strokeWidth="2" />
          <text x={p.x} y={pad.top + chartH + 22} textAnchor="middle" fontSize="10" fill="#6b7280">{p.label}</text>
          {p.revenue > 0 && (
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fill="#374151" fontWeight="600">
              {p.revenue >= 1000 ? `${(p.revenue / 1000).toFixed(1)}k` : p.revenue}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function MetricCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div className="rounded-lg p-6 border border-gray-300 bg-white">
      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
      <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
    </div>
  );
}
