'use client';

import PrivateRoute from '@/components/PrivateRoute';
import AdminDashboard from '@/components/pages/AdminDashboard';

export default function AdminPage() {
  return (
    <PrivateRoute roles={['admin']}>
      <AdminDashboard />
    </PrivateRoute>
  );
}
