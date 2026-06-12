'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PharmacyWorkspace } from '@/components/pharmacy/pharmacy-workspace';
import { PatientsWorkspace } from '@/components/patients/patients-workspace';
import { DoctorsWorkspace } from '@/components/doctors/doctors-workspace';
import { AppointmentsWorkspace } from '@/components/appointments/appointments-workspace';
import { BillingWorkspace } from '@/components/billing/billing-workspace';
import { ReportsWorkspace } from '@/components/reports/reports-workspace';
import { UsersWorkspace } from '@/components/users/users-workspace';
import { AnalyticsWorkspace } from '@/components/analytics/analytics-workspace';
import { BarChart2, ClipboardList, FileText, LogOut, Pill, Shield, Stethoscope, Users } from 'lucide-react';

type Section = 'patients' | 'doctors' | 'appointments' | 'pharmacy' | 'billing' | 'reports' | 'users' | 'analytics';
type UserRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PHARMACIST' | 'STAFF';

const ALL_NAV_ITEMS = [
  { label: 'Patients',     icon: Users,        id: 'patients'     as Section, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST'] },
  { label: 'Doctors',      icon: Stethoscope,  id: 'doctors'      as Section, roles: ['ADMIN'] },
  { label: 'Appointments', icon: ClipboardList, id: 'appointments' as Section, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF'] },
  { label: 'Pharmacy',     icon: Pill,         id: 'pharmacy'     as Section, roles: ['ADMIN', 'PHARMACIST'] },
  { label: 'Billing',      icon: FileText,     id: 'billing'      as Section, roles: ['ADMIN', 'RECEPTIONIST'] },
  { label: 'Reports',      icon: ClipboardList, id: 'reports'     as Section, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF'] },
  { label: 'Analytics',    icon: BarChart2,    id: 'analytics'    as Section, roles: ['ADMIN'] },
  { label: 'Users',        icon: Shield,       id: 'users'        as Section, roles: ['ADMIN'] },
];

function getDefaultSection(role: UserRole): Section {
  switch (role) {
    case 'PHARMACIST': return 'pharmacy';
    case 'DOCTOR':     return 'appointments';
    case 'RECEPTIONIST': return 'appointments';
    case 'STAFF':      return 'appointments';
    default:           return 'patients';
  }
}

export default function Home() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>('patients');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userName, setUserName] = useState('Administrator');
  const [userRole, setUserRole] = useState<UserRole>('ADMIN');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const storedName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
    const storedRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;

    if (token) {
      setIsAuthenticated(true);
      if (storedName) setUserName(storedName);
      if (storedRole) {
        const role = storedRole as UserRole;
        setUserRole(role);
        setActiveSection(getDefaultSection(role));
      }
    } else {
      setIsAuthenticated(false);
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
    }
    router.push('/login');
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const navItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(userRole));

  const renderSection = () => {
    switch (activeSection) {
      case 'patients':     return <PatientsWorkspace />;
      case 'doctors':      return <DoctorsWorkspace />;
      case 'appointments': return <AppointmentsWorkspace />;
      case 'pharmacy':     return <PharmacyWorkspace />;
      case 'billing':      return <BillingWorkspace />;
      case 'reports':      return <ReportsWorkspace />;
      case 'analytics':    return <AnalyticsWorkspace />;
      case 'users':        return <UsersWorkspace />;
      default:             return <PatientsWorkspace />;
    }
  };

  const roleLabel: Record<UserRole, string> = {
    ADMIN: 'Admin',
    DOCTOR: 'Doctor',
    RECEPTIONIST: 'Receptionist',
    PHARMACIST: 'Pharmacist',
    STAFF: 'Staff',
  };

  return (
    <div className="min-h-screen bg-[#e9edf1]">
      <header className="flex h-[76px] items-center justify-between border-b border-[#436f98] bg-[#5b8ab8] px-5 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center border border-white/40 bg-white text-[11px] font-bold text-[#507fa9]">
            HMS
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-normal">HMS</h1>
            <p className="text-xs text-white/85">Hospital Management System</p>
          </div>
        </div>
        <div className="text-sm font-semibold">
          Welcome, {userName} &nbsp;·&nbsp; <span className="opacity-80">{roleLabel[userRole]}</span>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-76px-36px)]">
        <aside className="flex w-[220px] shrink-0 flex-col border-r border-[#222] bg-[#303030] text-white">
          <nav className="flex-1 py-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex h-12 items-center gap-3 px-6 text-[15px] font-semibold ${
                  activeSection === item.id
                    ? 'bg-[#5b8ab8] text-white border-l-2 border-white'
                    : 'text-[#eeeeee] hover:bg-[#383838]'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
          <button
            onClick={handleLogout}
            className="flex h-14 items-center gap-3 px-6 text-[15px] font-semibold text-[#eeeeee] hover:bg-[#383838] w-full border-t border-[#444]"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>
        <main className="flex-1 overflow-auto p-4">{renderSection()}</main>
      </div>

      <footer className="border-t border-[#436f98] bg-[#5b8ab8] py-2 text-center text-xs text-white">
        © 2026 HMS — Hospital Management System &nbsp;|&nbsp; All Rights Reserved
      </footer>
    </div>
  );
}
