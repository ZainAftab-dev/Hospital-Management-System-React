'use client';

import { useEffect, useMemo, useState } from 'react';
import { doctors as initialDoctors } from '@/lib/mock-data';
import { hospitalApi } from '@/lib/api';
import type { Doctor } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Defined outside to prevent remount on every keystroke
function DoctorForm({
  formData,
  setFormData,
}: {
  formData: Partial<Doctor>;
  setFormData: (data: Partial<Doctor>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="doctor-name">Name *</Label>
        <Input id="doctor-name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Dr. Name" />
      </div>
      <div>
        <Label htmlFor="doctor-email">Email</Label>
        <Input id="doctor-email" type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@hospital.com" />
      </div>
      <div>
        <Label htmlFor="doctor-age">Age</Label>
        <Input id="doctor-age" type="number" value={formData.age || 30} onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })} />
      </div>
      <div>
        <Label htmlFor="doctor-gender">Gender</Label>
        <select id="doctor-gender" className="w-full border border-gray-300 rounded px-3 py-2" value={formData.gender || 'Male'} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
          <option>Male</option>
          <option>Female</option>
        </select>
      </div>
      <div>
        <Label htmlFor="doctor-contact">Contact *</Label>
        <Input id="doctor-contact" value={formData.contact || ''} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="Phone number" />
      </div>
      <div>
        <Label htmlFor="doctor-specialization">Specialization *</Label>
        <Input id="doctor-specialization" value={formData.specialization || ''} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} placeholder="e.g., Cardiology" />
      </div>
      <div>
        <Label htmlFor="doctor-qualification">Qualification</Label>
        <Input id="doctor-qualification" value={formData.qualification || ''} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} placeholder="e.g., MBBS, FCPS" />
      </div>
      <div>
        <Label htmlFor="doctor-license">License / PMDC No.</Label>
        <Input id="doctor-license" value={formData.licenseNumber || ''} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} placeholder="Medical registration number" />
      </div>
      <div>
        <Label htmlFor="doctor-fee">Consultation Fee (Rs.)</Label>
        <Input id="doctor-fee" type="number" value={formData.consultationFee || 0} onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="doctor-availability">Availability</Label>
        <select id="doctor-availability" className="w-full border border-gray-300 rounded px-3 py-2" value={formData.availability || 'yes'} onChange={(e) => setFormData({ ...formData, availability: e.target.value })}>
          <option value="yes">Available</option>
          <option value="no">Not Available</option>
        </select>
      </div>
      <div className="col-span-2">
        <Label htmlFor="doctor-address">Address</Label>
        <Input id="doctor-address" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Address" />
      </div>
    </div>
  );
}

export function DoctorsWorkspace() {
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Doctor>>({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    hospitalApi.doctors()
      .then((data) => {
        setDoctors(data);
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load doctors from database'))
      .finally(() => setIsLoading(false));
  }, []);

  const specializations = useMemo(() => {
    const unique = Array.from(new Set(doctors.map(d => d.specialization).filter(Boolean)));
    return ['All', ...unique.sort()];
  }, [doctors]);

  const filteredDoctors = doctors.filter((d) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      d.name.toLowerCase().includes(term) ||
      d.id.toLowerCase().includes(term) ||
      d.specialization.toLowerCase().includes(term) ||
      (d.licenseNumber ?? '').toLowerCase().includes(term);
    const matchesSpec = specializationFilter === 'All' || d.specialization === specializationFilter;
    return matchesSearch && matchesSpec;
  });

  const handleAddDoctor = () => {
    setFormData({
      id: 'D' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      name: '',
      age: 30,
      gender: 'Male',
      contact: '',
      email: '',
      address: '',
      specialization: '',
      qualification: '',
      availability: 'yes',
      consultationFee: '0',
      licenseNumber: ''
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData(doctor);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleSaveNewDoctor = async () => {
    if (formData.name && formData.contact && formData.specialization) {
      try {
        const saved = await hospitalApi.createDoctor(formData as Doctor);
        setDoctors([...doctors, saved]);
        setIsAddModalOpen(false);
        setFormData({});
        setFormError('');
        setError('');
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Failed to save doctor');
      }
    }
  };

  const handleSaveEditDoctor = async () => {
    if (editingDoctor && formData.name && formData.contact) {
      try {
        const saved = await hospitalApi.updateDoctor(editingDoctor.id, { ...formData, id: editingDoctor.id } as Doctor);
        setDoctors(doctors.map(d => d.id === editingDoctor.id ? saved : d));
        setIsEditModalOpen(false);
        setEditingDoctor(null);
        setSelectedDoctor(null);
        setFormData({});
        setFormError('');
        setError('');
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Failed to update doctor');
      }
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (confirm('Are you sure you want to delete this doctor?')) {
      try {
        await hospitalApi.deleteDoctor(doctorId);
        setDoctors(doctors.filter(d => d.id !== doctorId));
        setSelectedDoctor(null);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete doctor');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-300 bg-white p-6">
        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {isLoading && <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">Loading doctors from SQL Server...</div>}

        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing <strong>{filteredDoctors.length}</strong> of <strong>{doctors.length}</strong> doctors
          </span>
        </div>

        <div className="mb-6 flex gap-3 flex-wrap">
          <Input
            placeholder="Search by name, ID, specialization, or license..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[260px]"
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
          >
            {specializations.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button onClick={() => handleAddDoctor()}>Add Doctor</Button>
          <Button variant="outline" onClick={() => { setSearchTerm(''); setSpecializationFilter('All'); }}>Clear</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">ID</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Specialization</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Qualification</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Fee (Rs.)</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Availability</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Contact</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((doctor) => (
                <tr
                  key={doctor.id}
                  className="border-b border-gray-300 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <td className="border border-gray-300 px-4 py-2 font-medium">{doctor.id}</td>
                  <td className="border border-gray-300 px-4 py-2">{doctor.name}</td>
                  <td className="border border-gray-300 px-4 py-2 capitalize">{doctor.specialization}</td>
                  <td className="border border-gray-300 px-4 py-2">{doctor.qualification}</td>
                  <td className="border border-gray-300 px-4 py-2">Rs. {doctor.consultationFee}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${doctor.availability === 'yes' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {doctor.availability === 'yes' ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{doctor.contact}</td>
                </tr>
              ))}
              {filteredDoctors.length === 0 && (
                <tr>
                  <td colSpan={7} className="border border-gray-300 px-4 py-6 text-center text-gray-500">No doctors found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle>Doctor Information</DialogTitle>
          </DialogHeader>
          {selectedDoctor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
                <div><p className="font-semibold text-gray-700">Doctor ID:</p><p>{selectedDoctor.id}</p></div>
                <div><p className="font-semibold text-gray-700">Name:</p><p>{selectedDoctor.name}</p></div>
                <div><p className="font-semibold text-gray-700">Age:</p><p>{selectedDoctor.age}</p></div>
                <div><p className="font-semibold text-gray-700">Gender:</p><p>{selectedDoctor.gender}</p></div>
                <div><p className="font-semibold text-gray-700">Contact:</p><p>{selectedDoctor.contact}</p></div>
                <div><p className="font-semibold text-gray-700">Email:</p><p>{selectedDoctor.email || 'N/A'}</p></div>
                <div><p className="font-semibold text-gray-700">Specialization:</p><p className="capitalize">{selectedDoctor.specialization}</p></div>
                <div><p className="font-semibold text-gray-700">Qualification:</p><p>{selectedDoctor.qualification}</p></div>
                <div><p className="font-semibold text-gray-700">License / PMDC No.:</p><p>{selectedDoctor.licenseNumber || 'N/A'}</p></div>
                <div><p className="font-semibold text-gray-700">Consultation Fee:</p><p>Rs. {selectedDoctor.consultationFee}</p></div>
                <div><p className="font-semibold text-gray-700">Availability:</p>
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${selectedDoctor.availability === 'yes' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {selectedDoctor.availability === 'yes' ? 'Available' : 'Not Available'}
                  </span>
                </div>
                <div className="col-span-2"><p className="font-semibold text-gray-700">Address:</p><p>{selectedDoctor.address || 'N/A'}</p></div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedDoctor(null)}>Close</Button>
                <Button variant="outline" onClick={() => handleEditDoctor(selectedDoctor)}>Edit</Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteDoctor(selectedDoctor.id)}>Delete</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Doctor Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => { setIsAddModalOpen(open); if (!open) setFormError(''); }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader><DialogTitle>Add New Doctor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <DoctorForm formData={formData} setFormData={setFormData} />
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
              <Button onClick={handleSaveNewDoctor}>Save Doctor</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => { setIsEditModalOpen(open); if (!open) setFormError(''); }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader><DialogTitle>Edit Doctor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <DoctorForm formData={formData} setFormData={setFormData} />
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
              <Button onClick={handleSaveEditDoctor}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
