'use client';

import ContentList from '../ContentList';

export default function LearnerDashboard() {
  return (
    <div className="page">
      <h1>Learner Dashboard</h1>
      <p className="muted">Browse and view training content — PPTs, Videos, and PDFs.</p>
      <ContentList />
    </div>
  );
}
