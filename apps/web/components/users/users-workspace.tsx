'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { hospitalApi } from '@/lib/api';
import type { HospitalUser } from '@/types/hospital';

const initialUsers: HospitalUser[] = [
  {
    id: 'U001',
    name: 'Ahmed Khan',
    email: 'ahmed.khan@zmhospital.com',
    role: 'Admin',
    phone: '03001234567',
    department: 'Administration',
    joinDate: '01-01-2024',
    status: 'Active',
  },
  {
    id: 'U002',
    name: 'Dr. Aisha Malik',
    email: 'dr.aisha@zmhospital.com',
    role: 'Doctor',
    phone: '03415678901',
    department: 'Gynecology',
    joinDate: '15-02-2024',
    status: 'Active',
  },
  {
    id: 'U003',
    name: 'Fatima Hassan',
    email: 'fatima.hassan@zmhospital.com',
    role: 'Receptionist',
    phone: '03209876543',
    department: 'Front Desk',
    joinDate: '20-02-2024',
    status: 'Active',
  },
  {
    id: 'U004',
    name: 'Mohammad Ali',
    email: 'mohammad.ali@zmhospital.com',
    role: 'Pharmacist',
    phone: '03001111111',
    department: 'Pharmacy',
    joinDate: '10-03-2024',
    status: 'Active',
  },
];

export function UsersWorkspace() {
  const [users, setUsers] = useState<HospitalUser[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<HospitalUser | null>(null);
  const [editingUser, setEditingUser] = useState<HospitalUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<HospitalUser>>({});
  const [formError, setFormError] = useState('');
  const [userPassword, setUserPassword] = useState('');

  useEffect(() => {
    let mounted = true;

    hospitalApi.users()
      .then((data) => {
        if (mounted) setUsers(data);
      })
      .catch((error) => {
        console.error('Failed to load users', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.includes(searchTerm)
  );

  const handleAddUser = async () => {
    if (formData.name && formData.email && formData.phone && formData.role) {
      const newUser: HospitalUser = {
        id: '',
        name: formData.name,
        email: formData.email,
        role: formData.role as HospitalUser['role'],
        phone: formData.phone,
        department: formData.department || '',
        joinDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
        status: 'Active',
      };
      try {
        const savedUser = await hospitalApi.createUser(newUser, userPassword || undefined);
        setUsers([...users, savedUser]);
        setIsAddModalOpen(false);
        setFormData({});
        setFormError('');
        setUserPassword('');
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Failed to save user');
      }
    }
  };

  const handleEditUser = (user: HospitalUser) => {
    setEditingUser(user);
    setFormData(user);
    setFormError('');
    setUserPassword('');
    setIsEditModalOpen(true);
  };

  const handleSaveEditUser = async () => {
    if (editingUser && formData.name && formData.email && formData.phone) {
      try {
        const savedUser = await hospitalApi.updateUser(editingUser.id, formData as HospitalUser, userPassword || undefined);
        setUsers(users.map(u => u.id === editingUser.id ? savedUser : u));
        setIsEditModalOpen(false);
        setEditingUser(null);
        setSelectedUser(null);
        setFormData({});
        setFormError('');
        setUserPassword('');
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Failed to update user');
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await hospitalApi.deleteUser(userId);
        setUsers(users.filter(u => u.id !== userId));
        setSelectedUser(null);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete user');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-300 bg-white p-6">
        <div className="mb-6 flex gap-4">
          <Input
            placeholder="Search user by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => { setFormData({}); setFormError(''); setUserPassword(''); setIsAddModalOpen(true); }}>Add User</Button>
          <Button variant="outline" onClick={() => setSearchTerm('')}>Clear</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">ID</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Email</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Role</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Department</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-300 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <td className="border border-gray-300 px-4 py-2 font-medium">{user.id}</td>
                  <td className="border border-gray-300 px-4 py-2">{user.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                  <td className="border border-gray-300 px-4 py-2">{user.role}</td>
                  <td className="border border-gray-300 px-4 py-2">{user.department}</td>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">
                    <span className={
                      user.status === 'Active' ? 'text-green-700' :
                      user.status === 'Inactive' ? 'text-yellow-700' :
                      'text-red-700'
                    }>
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle>User Information</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">User ID:</p>
                  <p className="text-gray-900">{selectedUser.id}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Name:</p>
                  <p className="text-gray-900">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Email:</p>
                  <p className="text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Phone:</p>
                  <p className="text-gray-900">{selectedUser.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Role:</p>
                  <p className="text-gray-900">{selectedUser.role}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Department:</p>
                  <p className="text-gray-900">{selectedUser.department}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Join Date:</p>
                  <p className="text-gray-900">{selectedUser.joinDate}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Status:</p>
                  <p className={`font-semibold ${
                    selectedUser.status === 'Active' ? 'text-green-700' :
                    selectedUser.status === 'Inactive' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {selectedUser.status}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Close
                </Button>
                <Button variant="outline" onClick={() => handleEditUser(selectedUser)}>
                  Edit
                </Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteUser(selectedUser.id)}>
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => { setIsAddModalOpen(open); if (!open) { setFormError(''); setUserPassword(''); } }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full Name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@zmhospital.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={formData.role || 'Staff'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as HospitalUser['role'] })}
                >
                  <option>Admin</option>
                  <option>Doctor</option>
                  <option>Receptionist</option>
                  <option>Pharmacist</option>
                  <option>Staff</option>
                </select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Department"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="add-password">Password *</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="Min 8 characters"
                />
                <p className="text-xs text-gray-400 mt-1">This will be the user's login password.</p>
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
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser}>
                Save User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => { setIsEditModalOpen(open); if (!open) { setFormError(''); setUserPassword(''); } }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone *</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role *</Label>
                <select
                  id="edit-role"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={formData.role || 'Staff'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as HospitalUser['role'] })}
                >
                  <option>Admin</option>
                  <option>Doctor</option>
                  <option>Receptionist</option>
                  <option>Pharmacist</option>
                  <option>Staff</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={formData.status || 'Active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as HospitalUser['status'] })}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Suspended</option>
                </select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-password">New Password</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                />
                <p className="text-xs text-gray-400 mt-1">Only fill this if you want to change the password. Min 8 characters.</p>
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
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditUser}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
