'use client';

import { useEffect, useState } from 'react';
import { patients as initialPatients } from '@/lib/mock-data';
import { generatePatientReportPDF } from '@/lib/pdf-utils';
import { hospitalApi } from '@/lib/api';
import type { Patient } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Defined outside to prevent remount on every keystroke
function PatientForm({
  formData,
  setFormData,
  onPhotoChange,
}: {
  formData: Partial<Patient>;
  setFormData: (data: Partial<Patient>) => void;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full border-2 border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
          {formData.photoUrl ? (
            <img src={formData.photoUrl} alt="Patient" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl text-gray-400">👤</span>
          )}
        </div>
        <div>
          <Label htmlFor="patient-photo">Profile Photo</Label>
          <input
            id="patient-photo"
            type="file"
            accept="image/*"
            onChange={onPhotoChange}
            className="mt-1 block text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
          />
          <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 2MB recommended</p>
        </div>
      </div>
      <div>
        <Label htmlFor="patient-name">Name *</Label>
        <Input
          id="patient-name"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Full Name"
        />
      </div>
      <div>
        <Label htmlFor="patient-email">Email</Label>
        <Input
          id="patient-email"
          type="email"
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@example.com"
        />
      </div>
      <div>
        <Label htmlFor="patient-age">Age</Label>
        <Input
          id="patient-age"
          type="number"
          value={formData.age || 30}
          onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
        />
      </div>
      <div>
        <Label htmlFor="patient-gender">Gender</Label>
        <select
          id="patient-gender"
          className="w-full border border-gray-300 rounded px-3 py-2"
          value={formData.gender || 'Male'}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
        >
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
      </div>
      <div>
        <Label htmlFor="patient-contact">Contact *</Label>
        <Input
          id="patient-contact"
          value={formData.contact || ''}
          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
          placeholder="Phone number"
        />
      </div>
      <div>
        <Label htmlFor="patient-bloodGroup">Blood Group</Label>
        <select
          id="patient-bloodGroup"
          className="w-full border border-gray-300 rounded px-3 py-2"
          value={formData.bloodGroup || 'O+'}
          onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
        >
          {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => <option key={bg}>{bg}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="patient-emergencyContact">Emergency Contact Name</Label>
        <Input
          id="patient-emergencyContact"
          value={formData.emergencyContact || ''}
          onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
          placeholder="Next of kin name"
        />
      </div>
      <div>
        <Label htmlFor="patient-emergencyPhone">Emergency Phone</Label>
        <Input
          id="patient-emergencyPhone"
          value={formData.emergencyPhone || ''}
          onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
          placeholder="Emergency contact number"
        />
      </div>
      <div className="col-span-2">
        <Label htmlFor="patient-allergies">Allergies</Label>
        <Input
          id="patient-allergies"
          value={formData.allergies || 'N/A'}
          onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
          placeholder="e.g., Penicillin, Aspirin"
        />
      </div>
      <div className="col-span-2">
        <Label htmlFor="patient-disease">Diagnosis / Condition</Label>
        <Input
          id="patient-disease"
          value={formData.disease || ''}
          onChange={(e) => setFormData({ ...formData, disease: e.target.value })}
          placeholder="Current condition or diagnosis"
        />
      </div>
      <div className="col-span-2">
        <Label htmlFor="patient-address">Address</Label>
        <Input
          id="patient-address"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Address"
        />
      </div>
      <div className="col-span-2">
        <Label htmlFor="patient-status">Patient Status</Label>
        <select
          id="patient-status"
          className="w-full border border-gray-300 rounded px-3 py-2"
          value={formData.status || 'Stable'}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as Patient['status'] })}
        >
          <option value="Stable">🟢 Stable</option>
          <option value="Under Observation">🟡 Under Observation</option>
          <option value="Critical">🔴 Critical</option>
          <option value="Emergency">🚨 Emergency</option>
          <option value="Discharged">✅ Discharged</option>
        </select>
      </div>
    </div>
  );
}

export function PatientsWorkspace({ initialSearch = '' }: { initialSearch?: string } = {}) {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [genderFilter, setGenderFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    hospitalApi.patients()
      .then((data) => { setPatients(data); setError(''); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load patients from database'))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      p.name.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term) ||
      p.contact.includes(term) ||
      (p.disease ?? '').toLowerCase().includes(term) ||
      (p.bloodGroup ?? '').toLowerCase().includes(term);
    const matchesGender = genderFilter === 'All' || p.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  const handleAddPatient = () => {
    setFormData({
      id: 'P' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      name: '', age: 30, gender: 'Male', contact: '', email: '',
      address: '', disease: '', bloodGroup: 'O+', allergies: 'N/A',
      emergencyContact: '', emergencyPhone: '', status: 'Stable'
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData(patient);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleSaveNewPatient = async () => {
    if (formData.name && formData.contact) {
      try {
        const saved = await hospitalApi.createPatient(formData as Patient);
        setPatients([...patients, saved]);
        setIsAddModalOpen(false);
        setFormData({});
        setFormError('');
        setError('');
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Failed to save patient');
      }
    }
  };

  const handleSaveEditPatient = async () => {
    if (editingPatient && formData.name && formData.contact) {
      try {
        const saved = await hospitalApi.updatePatient(editingPatient.id, { ...formData, id: editingPatient.id } as Patient);
        setPatients(patients.map(p => p.id === editingPatient.id ? saved : p));
        setIsEditModalOpen(false);
        setEditingPatient(null);
        setSelectedPatient(null);
        setFormData({});
        setFormError('');
        setError('');
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Failed to update patient');
      }
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (confirm('Are you sure you want to delete this patient?')) {
      try {
        await hospitalApi.deletePatient(patientId);
        setPatients(patients.filter(p => p.id !== patientId));
        setSelectedPatient(null);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete patient');
      }
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-300 bg-white p-6">
        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {isLoading && <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">Loading patients from database...</div>}

        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing <strong>{filteredPatients.length}</strong> of <strong>{patients.length}</strong> patients
          </span>
        </div>

        <div className="mb-6 flex gap-3 flex-wrap">
          <Input
            placeholder="Search by name, ID, contact, diagnosis, blood group..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[260px]"
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <Button onClick={handleAddPatient}>Add Patient</Button>
          <Button variant="outline" onClick={() => { setSearchTerm(''); setGenderFilter('All'); }}>Clear</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className="border border-gray-300 px-2 py-2 text-left text-sm font-semibold w-12">Photo</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">ID</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Age</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Gender</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Contact</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Blood Group</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Diagnosis</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-b border-gray-300 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedPatient(patient)}
                >
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mx-auto">
                      {patient.photoUrl ? (
                        <img src={patient.photoUrl} alt={patient.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs text-gray-500">{patient.name.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 font-medium">{patient.id}</td>
                  <td className="border border-gray-300 px-4 py-2">{patient.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{patient.age}</td>
                  <td className="border border-gray-300 px-4 py-2">{patient.gender}</td>
                  <td className="border border-gray-300 px-4 py-2">{patient.contact}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {patient.bloodGroup
                      ? <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">{patient.bloodGroup}</span>
                      : 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{patient.disease || 'N/A'}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {(() => {
                      const s = patient.status || 'Stable';
                      const styles: Record<string, string> = {
                        'Stable':           'bg-green-100 text-green-800',
                        'Under Observation':'bg-yellow-100 text-yellow-800',
                        'Critical':         'bg-red-100 text-red-800',
                        'Emergency':        'bg-red-600 text-white',
                        'Discharged':       'bg-gray-100 text-gray-600',
                      };
                      return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${styles[s] ?? 'bg-gray-100 text-gray-600'}`}>{s}</span>;
                    })()}
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={9} className="border border-gray-300 px-4 py-6 text-center text-gray-500">No patients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle>Patient Information</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              {selectedPatient.photoUrl && (
                <div className="flex justify-center">
                  <img src={selectedPatient.photoUrl} alt={selectedPatient.name} className="h-24 w-24 rounded-full object-cover border-2 border-gray-300" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
                <div><p className="font-semibold text-gray-700">Patient ID:</p><p>{selectedPatient.id}</p></div>
                <div><p className="font-semibold text-gray-700">Name:</p><p>{selectedPatient.name}</p></div>
                <div><p className="font-semibold text-gray-700">Age:</p><p>{selectedPatient.age}</p></div>
                <div><p className="font-semibold text-gray-700">Gender:</p><p>{selectedPatient.gender}</p></div>
                <div><p className="font-semibold text-gray-700">Contact:</p><p>{selectedPatient.contact}</p></div>
                <div><p className="font-semibold text-gray-700">Email:</p><p>{selectedPatient.email || 'N/A'}</p></div>
                <div><p className="font-semibold text-gray-700">Blood Group:</p>
                  <p>{selectedPatient.bloodGroup
                    ? <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">{selectedPatient.bloodGroup}</span>
                    : 'N/A'}
                  </p>
                </div>
                <div><p className="font-semibold text-gray-700">Allergies:</p><p>{selectedPatient.allergies || 'N/A'}</p></div>
                <div><p className="font-semibold text-gray-700">Emergency Contact:</p><p>{selectedPatient.emergencyContact || 'N/A'}</p></div>
                <div><p className="font-semibold text-gray-700">Emergency Phone:</p><p>{selectedPatient.emergencyPhone || 'N/A'}</p></div>
                <div className="col-span-2"><p className="font-semibold text-gray-700">Address:</p><p>{selectedPatient.address || 'N/A'}</p></div>
                <div className="col-span-2"><p className="font-semibold text-gray-700">Diagnosis / Condition:</p><p>{selectedPatient.disease || 'N/A'}</p></div>
                <div className="col-span-2">
                  <p className="font-semibold text-gray-700">Patient Status:</p>
                  {(() => {
                    const s = selectedPatient.status || 'Stable';
                    const styles: Record<string, string> = {
                      'Stable':           'bg-green-100 text-green-800',
                      'Under Observation':'bg-yellow-100 text-yellow-800',
                      'Critical':         'bg-red-100 text-red-800',
                      'Emergency':        'bg-red-600 text-white',
                      'Discharged':       'bg-gray-100 text-gray-600',
                    };
                    return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${styles[s] ?? 'bg-gray-100 text-gray-600'}`}>{s}</span>;
                  })()}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedPatient(null)}>Close</Button>
                <Button variant="outline" onClick={() => handleEditPatient(selectedPatient)}>Edit</Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDeletePatient(selectedPatient.id)}>Delete</Button>
                <Button onClick={() => generatePatientReportPDF(selectedPatient)}>Print Report</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Patient Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => { setIsAddModalOpen(open); if (!open) setFormError(''); }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader><DialogTitle>Add New Patient</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <PatientForm formData={formData} setFormData={setFormData} onPhotoChange={handlePhotoChange} />
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
              <Button onClick={handleSaveNewPatient}>Save Patient</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => { setIsEditModalOpen(open); if (!open) setFormError(''); }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader><DialogTitle>Edit Patient</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <PatientForm formData={formData} setFormData={setFormData} onPhotoChange={handlePhotoChange} />
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
              <Button onClick={handleSaveEditPatient}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
