'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PharmacyWorkspace } from '@/components/pharmacy/pharmacy-workspace';
import { PatientsWorkspace } from '@/components/patients/patients-workspace';
import { DoctorsWorkspace } from '@/components/doctors/doctors-workspace';
import { AppointmentsWorkspace } from '@/components/appointments/appointments-workspace';
import { BillingWorkspace } from '@/components/billing/billing-workspace';
import { ReportsWorkspace } from '@/components/reports/reports-workspace';
import { UsersWorkspace } from '@/components/users/users-workspace';
import { AnalyticsWorkspace } from '@/components/analytics/analytics-workspace';
import { DashboardWorkspace, initials } from '@/components/dashboard/dashboard-workspace';
import { WardsWorkspace } from '@/components/wards/wards-workspace';
import {
  BarChart2,
  BedDouble,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LineChart,
  LogOut,
  Pill,
  Search,
  Shield,
  Stethoscope,
  Users
} from 'lucide-react';
import { hospitalApi } from '@/lib/api';

type Section =
  | 'dashboard'
  | 'patients'
  | 'doctors'
  | 'appointments'
  | 'wards'
  | 'pharmacy'
  | 'billing'
  | 'reports'
  | 'users'
  | 'analytics';
type UserRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PHARMACIST' | 'STAFF';

const ALL_NAV_ITEMS = [
  { label: 'Dashboard',    icon: LayoutDashboard, id: 'dashboard'    as Section, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF'] },
  { label: 'Patients',     icon: Users,           id: 'patients'     as Section, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST'] },
  { label: 'Appointments', icon: CalendarDays,    id: 'appointments' as Section, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF'] },
  { label: 'Wards & beds', icon: BedDouble,       id: 'wards'        as Section, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF'] },
  { label: 'Doctors',      icon: Stethoscope,     id: 'doctors'      as Section, roles: ['ADMIN'] },
  { label: 'Pharmacy',     icon: Pill,            id: 'pharmacy'     as Section, roles: ['ADMIN', 'PHARMACIST'] },
  { label: 'Billing',      icon: FileText,        id: 'billing'      as Section, roles: ['ADMIN', 'RECEPTIONIST', 'PHARMACIST'] },
  { label: 'Reports',      icon: LineChart,       id: 'reports'      as Section, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF'] },
  { label: 'Analytics',    icon: BarChart2,       id: 'analytics'    as Section, roles: ['ADMIN'] },
  { label: 'Users',        icon: Shield,          id: 'users'        as Section, roles: ['ADMIN'] },
];

const CAN_CREATE_APPOINTMENTS: UserRole[] = ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF'];
const CAN_EDIT_WARDS: UserRole[] = ['ADMIN', 'RECEPTIONIST', 'STAFF'];

function getDefaultSection(role: UserRole): Section {
  return role === 'PHARMACIST' ? 'pharmacy' : 'dashboard';
}

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userName, setUserName] = useState('Administrator');
  const [userRole, setUserRole] = useState<UserRole>('ADMIN');
  const [search, setSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [openNewAppointment, setOpenNewAppointment] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [viewKey, setViewKey] = useState(0);
  const [slowStart, setSlowStart] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlowStart(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    hospitalApi.me()
      .then((user) => {
        setIsAuthenticated(true);
        setUserName(user.name);
        const role = user.role as UserRole;
        setUserRole(role);
        setActiveSection(getDefaultSection(role));
        if (typeof window !== 'undefined') {
          localStorage.setItem('userName', user.name);
          localStorage.setItem('userRole', user.role);
        }
        if (role !== 'PHARMACIST') {
          hospitalApi.appointments()
            .then((items) => setPendingCount(items.filter((a) => a.status === 'Pending').length))
            .catch(() => setPendingCount(0));
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        router.push('/login');
      });
  }, [router]);

  const handleLogout = async () => {
    await hospitalApi.logout().catch(() => {});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
    }
    router.push('/login');
  };

  const go = (section: Section, options: { patientSearch?: string; newAppointment?: boolean } = {}) => {
    setPatientSearch(options.patientSearch ?? '');
    setOpenNewAppointment(Boolean(options.newAppointment));
    setActiveSection(section);
    setViewKey((k) => k + 1);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    if (search.trim()) go('patients', { patientSearch: search.trim() });
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] p-6">
        <div role="status" aria-live="polite" className="max-w-sm text-center text-gray-600">
          <div className="text-lg">Loading...</div>
          {slowStart && (
            <p className="mt-3 text-sm text-gray-500">
              Waking up the demo server. It sleeps when nobody has used it for a while and can take up to a
              minute to start.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const navItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(userRole));
  const canSearchPatients = navItems.some((item) => item.id === 'patients');
  const canCreateAppointment = CAN_CREATE_APPOINTMENTS.includes(userRole);

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardWorkspace onOpenAppointments={() => go('appointments')} onOpenWards={() => go('wards')} />;
      case 'patients':     return <PatientsWorkspace initialSearch={patientSearch} />;
      case 'doctors':      return <DoctorsWorkspace />;
      case 'appointments': return <AppointmentsWorkspace openNew={openNewAppointment} />;
      case 'wards':        return <WardsWorkspace canEdit={CAN_EDIT_WARDS.includes(userRole)} />;
      case 'pharmacy':     return <PharmacyWorkspace />;
      case 'billing':      return <BillingWorkspace />;
      case 'reports':      return <ReportsWorkspace />;
      case 'analytics':    return <AnalyticsWorkspace />;
      case 'users':        return <UsersWorkspace />;
      default:             return <PatientsWorkspace />;
    }
  };

  const isDashboardStyled = activeSection === 'dashboard' || activeSection === 'wards';
  const activeLabel = ALL_NAV_ITEMS.find((item) => item.id === activeSection)?.label ?? '';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const title = activeSection === 'dashboard' ? `${greeting()}, ${userName}` : activeLabel;
  const subtitle =
    activeSection === 'dashboard'
      ? `${today} · Outpatient & ward overview`
      : `${today} · ZM Hospital Management System`;

  return (
    <div className="zm">
      <aside className="zm-side">
        <div className="zm-brand"><i>+</i>ZM HMS</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => go(item.id)}
            className={`zm-nav${activeSection === item.id ? ' on' : ''}`}
            aria-current={activeSection === item.id ? 'page' : undefined}
          >
            <item.icon strokeWidth={2} />
            {item.label}
            {item.id === 'appointments' && pendingCount > 0 && <span className="ct">{pendingCount}</span>}
          </button>
        ))}
        <div className="zm-side-ft">
          <button type="button" onClick={handleLogout} className="zm-nav">
            <LogOut strokeWidth={2} />
            Logout
          </button>
          <small>{navItems.length} modules · v1.0</small>
        </div>
      </aside>

      <main className="zm-main">
        <div className="zm-top">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {canSearchPatients ? (
            <form className="zm-search" onSubmit={submitSearch} role="search">
              <Search strokeWidth={2} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patients, ID…"
                aria-label="Search patients"
              />
            </form>
          ) : (
            <span style={{ marginLeft: 'auto' }} />
          )}
          {canCreateAppointment && (
            <button type="button" className="zm-btn" onClick={() => go('appointments', { newAppointment: true })}>
              + New appointment
            </button>
          )}
          <span className="zm-doc" title={`${userName} · ${userRole.toLowerCase()}`}>{initials(userName) || 'ZM'}</span>
        </div>

        {isDashboardStyled ? (
          <div key={viewKey} style={{ display: 'contents' }}>{renderSection()}</div>
        ) : (
          <div key={viewKey} className="zm-section">{renderSection()}</div>
        )}
      </main>
    </div>
  );
}
