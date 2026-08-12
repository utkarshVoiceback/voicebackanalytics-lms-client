'use client';

import { useState } from 'react';
import UploadForm from '../UploadForm';
import ContentList from '../ContentList';
import UserManagement from '../UserManagement';

type Tab = 'content' | 'users';

export default function SuperAdminDashboard() {
  const [tab, setTab] = useState<Tab>('content');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="page">
      <h1>Super Admin Dashboard</h1>
      <p className="muted">Full control: manage Admin & Learner accounts, upload and manage all content.</p>

      <div className="tabs">
        <button className={`tab ${tab === 'content' ? 'tab-active' : ''}`} onClick={() => setTab('content')}>
          Content
        </button>
        <button className={`tab ${tab === 'users' ? 'tab-active' : ''}`} onClick={() => setTab('users')}>
          Users
        </button>
      </div>

      {tab === 'content' && (
        <div className="grid-2">
          <UploadForm onUploaded={() => setRefreshKey((k) => k + 1)} />
          <ContentList canDelete={() => true} refreshKey={refreshKey} />
        </div>
      )}

      {tab === 'users' && <UserManagement />}
    </div>
  );
}
