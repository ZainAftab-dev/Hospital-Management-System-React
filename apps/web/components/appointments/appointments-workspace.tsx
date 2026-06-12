'use client';

import { useEffect, useMemo, useState } from 'react';
import { appointments as initialAppointments, doctors as initialDoctors, patients as initialPatients } from '@/lib/mock-data';
import { hospitalApi } from '@/lib/api';
import type { Appointment, Doctor, Patient } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar, List } from 'lucide-react';

const APPOINTMENT_TYPES = ['In-Person', 'Follow-up', 'Emergency'];
const APPOINTMENT_STATUSES = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Confirmed: 'bg-green-50 text-green-700',
    Pending:   'bg-yellow-50 text-yellow-700',
    Completed: 'bg-blue-50 text-blue-700',
    Cancelled: 'bg-red-50 text-red-700'
  };
  return `rounded px-2 py-0.5 text-xs font-semibold ${map[status] ?? 'bg-gray-50 text-gray-700'}`;
}

function typeBadge(type?: string) {
  if (type === 'Emergency') return 'rounded px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800';
  if (type === 'Follow-up') return 'rounded px-2 py-0.5 text-xs font-semibold bg-purple-50 text-purple-700';
  return 'rounded px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700';
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function AppointmentsWorkspace() {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Appointment>>({});
  const [formError, setFormError] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);
  const [reminderSent, setReminderSent] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([hospitalApi.appointments(), hospitalApi.patients(), hospitalApi.doctors()])
      .then(([a, p, d]) => {
        setAppointments(a);
        setPatients(p);
        setDoctors(d);
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load appointments from database'))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredAppointments = appointments.filter((a) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      a.patientName.toLowerCase().includes(term) ||
      a.id.toLowerCase().includes(term) ||
      a.doctorName.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = appointments.filter(a => a.date === todayStr).length;
  const pendingCount = appointments.filter(a => a.status === 'Pending').length;

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calendarDate]);

  const appointmentsByDay = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const map: Record<string, Appointment[]> = {};
    appointments.forEach(a => {
      const d = new Date(a.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = a.date.slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(a);
      }
    });
    return map;
  }, [appointments, calendarDate]);

  const selectedDayAppointments = useMemo(() => {
    if (!selectedCalendarDay) return [];
    return appointments.filter(a => a.date.slice(0, 10) === selectedCalendarDay);
  }, [appointments, selectedCalendarDay]);

  const handleReschedule = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData(appointment);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleAddAppointment = () => {
    const patient = patients[0];
    const doctor = doctors.find(d => d.availability === 'yes') ?? doctors[0];
    setFormData({
      id: `APT${Date.now()}`,
      patientId: patient?.id ?? '',
      patientName: patient?.name ?? '',
      doctorId: doctor?.id ?? '',
      doctorName: doctor?.name ?? '',
      date: new Date().toISOString().slice(0, 10),
      time: '09:00',
      status: 'Pending',
      type: 'In-Person',
      notes: ''
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveNewAppointment = async () => {
    if (!formData.patientId || !formData.doctorId || !formData.date || !formData.time) return;
    const patient = patients.find(p => p.id === formData.patientId);
    const doctor = doctors.find(d => d.id === formData.doctorId);
    const appointment: Appointment = {
      id: formData.id ?? `APT${Date.now()}`,
      patientId: formData.patientId,
      patientName: patient?.name ?? formData.patientName ?? '',
      doctorId: formData.doctorId,
      doctorName: doctor?.name ?? formData.doctorName ?? '',
      date: formData.date,
      time: formData.time,
      status: formData.status ?? 'Pending',
      type: formData.type ?? 'In-Person',
      notes: formData.notes
    };
    try {
      const saved = await hospitalApi.createAppointment(appointment);
      setAppointments(curr => [...curr, saved]);
      setIsAddModalOpen(false);
      setFormData({});
      setFormError('');
      setError('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save appointment');
    }
  };

  const handleSaveReschedule = async () => {
    if (editingAppointment && formData.date && formData.time) {
      const next = { ...editingAppointment, ...formData } as Appointment;
      try {
        const saved = await hospitalApi.updateAppointment(editingAppointment.id, next);
        setAppointments(appointments.map(a => a.id === editingAppointment.id ? saved : a));
        setIsEditModalOpen(false);
        setEditingAppointment(null);
        setSelectedAppointment(null);
        setFormData({});
        setFormError('');
        setError('');
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Unable to update appointment');
      }
    }
  };

  const handleUpdateStatus = async (appointmentId: string, status: Appointment['status']) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;
    try {
      const saved = await hospitalApi.updateAppointment(appointmentId, { ...apt, status });
      setAppointments(appointments.map(a => a.id === appointmentId ? saved : a));
      setSelectedAppointment(saved);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (confirm('Are you sure you want to delete this appointment?')) {
      try {
        await hospitalApi.deleteAppointment(appointmentId);
        setAppointments(appointments.filter(a => a.id !== appointmentId));
        setSelectedAppointment(null);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete appointment');
      }
    }
  };

  const handleSendReminder = (apt: Appointment) => {
    setReminderSent(apt.id);
    setTimeout(() => setReminderSent(null), 3000);
  };

  const prevMonth = () => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-300 bg-white p-6">
        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {isLoading && <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">Loading appointments from SQL Server...</div>}

        <div className="mb-4 flex gap-6 flex-wrap text-sm text-gray-600">
          <span>Total: <strong>{appointments.length}</strong></span>
          <span>Today: <strong className="text-blue-700">{todayCount}</strong></span>
          <span>Pending: <strong className="text-yellow-700">{pendingCount}</strong></span>
        </div>

        <div className="mb-6 flex gap-3 flex-wrap items-center">
          <Input
            placeholder="Search by patient, doctor, or appointment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[260px]"
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {APPOINTMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button onClick={handleAddAppointment}>New Appointment</Button>
          <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}>Clear</Button>
          <div className="flex border border-gray-300 rounded overflow-hidden ml-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium ${viewMode === 'table' ? 'bg-[#5b8ab8] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <List className="h-4 w-4" /> List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium ${viewMode === 'calendar' ? 'bg-[#5b8ab8] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Calendar className="h-4 w-4" /> Calendar
            </button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">ID</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Patient</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Doctor</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Time</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Type</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="border-b border-gray-300 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <td className="border border-gray-300 px-4 py-2 font-medium">{appointment.id}</td>
                    <td className="border border-gray-300 px-4 py-2">{appointment.patientName}</td>
                    <td className="border border-gray-300 px-4 py-2">{appointment.doctorName}</td>
                    <td className="border border-gray-300 px-4 py-2">{appointment.date}</td>
                    <td className="border border-gray-300 px-4 py-2">{appointment.time}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={typeBadge(appointment.type)}>{appointment.type ?? 'In-Person'}</span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={statusBadge(appointment.status)}>{appointment.status}</span>
                    </td>
                  </tr>
                ))}
                {filteredAppointments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="border border-gray-300 px-4 py-6 text-center text-gray-500">No appointments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Calendar View */
          <div>
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50">‹ Prev</button>
              <h3 className="text-base font-semibold text-gray-800">
                {MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
              </h3>
              <button onClick={nextMonth} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50">Next ›</button>
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded overflow-hidden">
              {DAYS_SHORT.map(d => (
                <div key={d} className="bg-gray-100 text-center text-xs font-semibold text-gray-600 py-2">{d}</div>
              ))}
              {calendarDays.map((day, i) => {
                if (!day) return <div key={i} className="bg-white min-h-[72px]" />;
                const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayApts = appointmentsByDay[dateStr] ?? [];
                const isToday = dateStr === todayStr;
                const isSelected = selectedCalendarDay === dateStr;
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedCalendarDay(isSelected ? null : dateStr)}
                    className={`bg-white min-h-[72px] p-1.5 cursor-pointer hover:bg-blue-50 transition-colors ${isSelected ? 'ring-2 ring-[#5b8ab8] ring-inset' : ''}`}
                  >
                    <span className={`text-sm font-semibold inline-block w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#5b8ab8] text-white' : 'text-gray-800'}`}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayApts.slice(0, 3).map(a => (
                        <div
                          key={a.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedAppointment(a); }}
                          className={`text-[10px] px-1 py-0.5 rounded truncate cursor-pointer ${
                            a.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                            a.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            a.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {a.time} {a.patientName}
                        </div>
                      ))}
                      {dayApts.length > 3 && (
                        <div className="text-[10px] text-gray-500 pl-1">+{dayApts.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedCalendarDay && selectedDayAppointments.length > 0 && (
              <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Appointments on {selectedCalendarDay}
                </h4>
                <div className="space-y-2">
                  {selectedDayAppointments.map(a => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 bg-white rounded border border-gray-200 px-3 py-2 cursor-pointer hover:bg-blue-50"
                      onClick={() => setSelectedAppointment(a)}
                    >
                      <span className="text-sm font-medium text-gray-700 w-14">{a.time}</span>
                      <span className="text-sm text-gray-800 flex-1">{a.patientName}</span>
                      <span className="text-xs text-gray-500">{a.doctorName}</span>
                      <span className={statusBadge(a.status)}>{a.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              {reminderSent === selectedAppointment.id && (
                <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  ✓ Reminder sent to {selectedAppointment.patientName} for appointment on {selectedAppointment.date} at {selectedAppointment.time}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
                <div><p className="font-semibold text-gray-700">Appointment ID:</p><p>{selectedAppointment.id}</p></div>
                <div><p className="font-semibold text-gray-700">Status:</p>
                  <span className={statusBadge(selectedAppointment.status)}>{selectedAppointment.status}</span>
                </div>
                <div><p className="font-semibold text-gray-700">Type:</p>
                  <span className={typeBadge(selectedAppointment.type)}>{selectedAppointment.type ?? 'In-Person'}</span>
                </div>
                <div><p className="font-semibold text-gray-700">Patient:</p><p>{selectedAppointment.patientName}</p></div>
                <div><p className="font-semibold text-gray-700">Doctor:</p><p>{selectedAppointment.doctorName}</p></div>
                <div><p className="font-semibold text-gray-700">Date:</p><p>{selectedAppointment.date}</p></div>
                <div><p className="font-semibold text-gray-700">Time:</p><p>{selectedAppointment.time}</p></div>
                <div className="col-span-2"><p className="font-semibold text-gray-700">Notes:</p><p>{selectedAppointment.notes || 'No notes'}</p></div>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t flex-wrap">
                <Button variant="outline" onClick={() => setSelectedAppointment(null)}>Close</Button>
                <Button
                  variant="outline"
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => handleSendReminder(selectedAppointment)}
                  title="Simulate sending SMS/WhatsApp reminder"
                >
                  Send Reminder
                </Button>
                <Button variant="outline" onClick={() => handleReschedule(selectedAppointment)}>Reschedule</Button>
                {selectedAppointment.status === 'Pending' && (
                  <Button variant="outline" onClick={() => handleUpdateStatus(selectedAppointment.id, 'Confirmed')}>Confirm</Button>
                )}
                {selectedAppointment.status === 'Confirmed' && (
                  <Button variant="outline" onClick={() => handleUpdateStatus(selectedAppointment.id, 'Completed')}>Mark Completed</Button>
                )}
                {selectedAppointment.status !== 'Cancelled' && selectedAppointment.status !== 'Completed' && (
                  <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => {
                    if (confirm('Cancel this appointment?')) handleUpdateStatus(selectedAppointment.id, 'Cancelled');
                  }}>Cancel</Button>
                )}
                <Button variant="outline" className="text-red-600" onClick={() => handleDeleteAppointment(selectedAppointment.id)}>Delete</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Appointment Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => { setIsAddModalOpen(open); if (!open) setFormError(''); }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader><DialogTitle>New Appointment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-patient">Patient *</Label>
                <select
                  id="new-patient"
                  className="h-8 w-full rounded-sm border border-input bg-white px-2 text-sm text-gray-900"
                  value={formData.patientId ?? ''}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                >
                  {patients.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="new-doctor">Doctor *</Label>
                <select
                  id="new-doctor"
                  className="h-8 w-full rounded-sm border border-input bg-white px-2 text-sm text-gray-900"
                  value={formData.doctorId ?? ''}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialization}{d.availability !== 'yes' ? ' (Unavailable)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="new-date">Date *</Label>
                <Input id="new-date" type="date" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="new-time">Time *</Label>
                <Input id="new-time" type="time" value={formData.time || ''} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="new-type">Appointment Type</Label>
                <select
                  id="new-type"
                  className="h-8 w-full rounded-sm border border-input bg-white px-2 text-sm text-gray-900"
                  value={formData.type ?? 'In-Person'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="new-status">Status</Label>
                <select
                  id="new-status"
                  className="h-8 w-full rounded-sm border border-input bg-white px-2 text-sm text-gray-900"
                  value={formData.status ?? 'Pending'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Appointment['status'] })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                </select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="new-notes">Notes</Label>
                <Input
                  id="new-notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Reason for visit or special instructions"
                />
              </div>
            </div>
            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <p className="font-semibold mb-1">Please fix the following:</p>
                <ul className="space-y-0.5">
                  {formError.split('\n').map((msg, i) => (
                    <li key={i} className="flex gap-1.5"><span>•</span><span>{msg}</span></li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveNewAppointment}>Save Appointment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => { setIsEditModalOpen(open); if (!open) setFormError(''); }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader><DialogTitle>Reschedule / Edit Appointment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-date">Date *</Label>
                <Input id="edit-date" type="date" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-time">Time *</Label>
                <Input id="edit-time" type="time" value={formData.time || ''} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-type">Appointment Type</Label>
                <select
                  id="edit-type"
                  className="h-8 w-full rounded-sm border border-input bg-white px-2 text-sm text-gray-900"
                  value={formData.type ?? 'In-Person'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  className="h-8 w-full rounded-sm border border-input bg-white px-2 text-sm text-gray-900"
                  value={formData.status ?? 'Pending'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Appointment['status'] })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Input id="edit-notes" value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
            </div>
            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <p className="font-semibold mb-1">Please fix the following:</p>
                <ul className="space-y-0.5">
                  {formError.split('\n').map((msg, i) => (
                    <li key={i} className="flex gap-1.5"><span>•</span><span>{msg}</span></li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveReschedule}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
