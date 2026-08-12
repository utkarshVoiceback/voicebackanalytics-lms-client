'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api/axios';
import { ContentItem, ContentType } from '@/types';

const TYPE_META: Record<ContentType, { label: string; icon: string }> = {
  ppt: { label: 'PPT', icon: '📊' },
  video: { label: 'Video', icon: '🎬' },
  pdf: { label: 'PDF', icon: '📄' },
};

type FilterValue = 'all' | ContentType;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ContentListProps {
  canDelete?: (item: ContentItem) => boolean;
  refreshKey?: number;
}

export default function ContentList({ canDelete, refreshKey }: ContentListProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handleViewFile(contentId: string): void {
    const token = localStorage.getItem('lms_token');
    const url = `/api/content/${contentId}/file${token ? `?token=${token}` : ''}`;
    window.open(url, '_blank');
  }

  function handleDownloadFile(contentId: string): void {
    const token = localStorage.getItem('lms_token');
    const url = `/api/content/${contentId}/file?download=1${token ? `&token=${token}` : ''}`;
    window.location.href = url;
  }

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ content: ContentItem[] }>('/content', {
        params: filter === 'all' ? {} : { type: filter },
      });
      setItems(res.data.content);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, refreshKey]);

  async function handleDelete(id: string): Promise<void> {
    if (!window.confirm('Delete this content? This cannot be undone.')) return;
    try {
      await api.delete(`/content/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  }

  const filters: FilterValue[] = ['all', 'ppt', 'video', 'pdf'];

  return (
    <div className="card">
      <div className="content-header">
        <h3>Content Library</h3>
        <div className="filter-group">
          {filters.map((t) => (
            <button key={t} className={`chip ${filter === t ? 'chip-active' : ''}`} onClick={() => setFilter(t)}>
              {t === 'all' ? 'All' : `${TYPE_META[t].icon} ${TYPE_META[t].label}`}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="muted">Loading content...</p>}
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && items.length === 0 && <p className="muted">No content available yet.</p>}

      <ul className="content-list">
        {items.map((item) => (
          <li key={item._id} className="content-item">
            <div className="content-item-main">
              <span className="content-icon">{TYPE_META[item.type]?.icon}</span>
              <div>
                <div className="content-title">{item.title}</div>
                <div className="muted small">
                  {TYPE_META[item.type]?.label} · {formatSize(item.sizeBytes)} · uploaded by{' '}
                  {item.uploadedBy?.name || 'Unknown'} · {new Date(item.createdAt).toLocaleDateString()}
                </div>
                {item.description && <div className="content-desc">{item.description}</div>}
              </div>
            </div>
            <div className="content-item-actions">
              <button className="btn btn-secondary" onClick={() => handleViewFile(item._id)}>
                View
              </button>
              <button className="btn btn-secondary" onClick={() => handleDownloadFile(item._id)}>
                Download
              </button>
              {canDelete?.(item) && (
                <button className="btn btn-danger" onClick={() => handleDelete(item._id)}>
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
