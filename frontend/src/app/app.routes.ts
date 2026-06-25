import { Routes } from '@angular/router';
import { roleGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/public/home/home').then((m) => m.Home),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/public/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/public/register/register').then((m) => m.Register),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/public/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/public/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'facility/:id',
    loadComponent: () =>
      import('./features/public/facility-details/facility-details').then((m) => m.FacilityDetails),
  },
  // ---- Athlete ----
  {
    path: 'athlete',
    canActivate: [roleGuard('athlete')],
    children: [
      { path: 'profile', loadComponent: () => import('./features/athlete/profile/profile').then((m) => m.AthleteProfile) },
      { path: 'reservations', loadComponent: () => import('./features/athlete/reservations/reservations').then((m) => m.AthleteReservations) },
      { path: 'search', loadComponent: () => import('./features/athlete/search/search').then((m) => m.AthleteSearch) },
      { path: 'facility/:id', loadComponent: () => import('./features/athlete/facility-reserve/facility-reserve').then((m) => m.FacilityReserve) },
      { path: 'teammates', loadComponent: () => import('./features/athlete/teammates/teammates').then((m) => m.Teammates) },
      { path: 'trainings', loadComponent: () => import('./features/athlete/trainings/trainings').then((m) => m.Trainings) },
      { path: 'shop', loadComponent: () => import('./features/athlete/shop/shop').then((m) => m.Shop) },
      { path: 'statistics', loadComponent: () => import('./features/athlete/statistics/statistics').then((m) => m.Statistics) },
      { path: '', redirectTo: 'search', pathMatch: 'full' },
    ],
  },

  // ---- Employee ----
  {
    path: 'employee',
    canActivate: [roleGuard('employee')],
    children: [
      { path: 'profile', loadComponent: () => import('./features/employee/profile/profile').then((m) => m.EmployeeProfile) },
      { path: 'facilities', loadComponent: () => import('./features/employee/facilities/facilities').then((m) => m.EmployeeFacilities) },
      { path: 'reservations', loadComponent: () => import('./features/employee/reservations/reservations').then((m) => m.EmployeeReservations) },
      { path: 'calendar', loadComponent: () => import('./features/employee/calendar/calendar').then((m) => m.EmployeeCalendar) },
      { path: 'promotions', loadComponent: () => import('./features/employee/promotions/promotions').then((m) => m.EmployeePromotions) },
      { path: 'equipment', loadComponent: () => import('./features/employee/equipment/equipment').then((m) => m.EmployeeEquipment) },
      { path: 'reports', loadComponent: () => import('./features/employee/reports/reports').then((m) => m.EmployeeReports) },
      { path: '', redirectTo: 'facilities', pathMatch: 'full' },
    ],
  },

  // ---- Admin ----
  // Hidden admin login lives at /admin (not linked from the home page or menu);
  // the feature pages stay under /admin/* and remain role-guarded.
  {
    path: 'admin',
    children: [
      { path: '', loadComponent: () => import('./features/admin/admin-login/admin-login').then((m) => m.AdminLogin) },
      { path: 'users', canActivate: [roleGuard('admin')], loadComponent: () => import('./features/admin/users/users').then((m) => m.AdminUsers) },
      { path: 'requests', canActivate: [roleGuard('admin')], loadComponent: () => import('./features/admin/requests/requests').then((m) => m.AdminRequests) },
      { path: 'facilities', canActivate: [roleGuard('admin')], loadComponent: () => import('./features/admin/facilities/facilities').then((m) => m.AdminFacilities) },
      { path: 'trainers', canActivate: [roleGuard('admin')], loadComponent: () => import('./features/admin/trainers/trainers').then((m) => m.AdminTrainers) },
      { path: 'sports', canActivate: [roleGuard('admin')], loadComponent: () => import('./features/admin/sports/sports').then((m) => m.AdminSports) },
    ],
  },

  { path: '**', redirectTo: '' },
];
