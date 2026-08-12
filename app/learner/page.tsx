'use client';

import PrivateRoute from '@/components/PrivateRoute';
import LearnerDashboard from '@/components/pages/LearnerDashboard';

export default function LearnerPage() {
  return (
    <PrivateRoute roles={['learner']}>
      <LearnerDashboard />
    </PrivateRoute>
  );
}
