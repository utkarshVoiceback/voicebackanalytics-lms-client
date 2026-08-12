'use client';

import PrivateRoute from '@/components/PrivateRoute';
import SuperAdminDashboard from '@/components/pages/SuperAdminDashboard';

export default function SuperAdminPage() {
  return (
    <PrivateRoute roles={['super-admin']}>
      <SuperAdminDashboard />
    </PrivateRoute>
  );
}
