import { useState } from 'react';
import UploadForm from '../components/UploadForm';
import ContentList from '../components/ContentList';
import { useAuth } from '../context/AuthContext';
import { ContentItem } from '../types';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  function canDelete(item: ContentItem): boolean {
    return item.uploadedBy?.id === user?.id;
  }

  return (
    <div className="page">
      <h1>Admin Dashboard</h1>
      <p className="muted">Upload PPT, Video, or PDF training content for learners.</p>

      <div className="grid-2">
        <UploadForm onUploaded={() => setRefreshKey((k) => k + 1)} />
        <ContentList canDelete={canDelete} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
