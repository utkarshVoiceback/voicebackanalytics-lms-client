import { useState, FormEvent, ChangeEvent } from 'react';
import api from '../api/axios';
import { ContentItem } from '../types';

const ACCEPTED = [
  '.ppt',
  '.pptx',
  '.pdf',
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.webm',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/pdf',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
].join(',');

interface UploadFormProps {
  onUploaded?: (content: ContentItem) => void;
}

interface Message {
  type: 'success' | 'error';
  text: string;
}

export default function UploadForm({ onUploaded }: UploadFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!file) {
      setMessage({ type: 'error', text: 'Please choose a PPT, Video, or PDF file' });
      return;
    }
    setBusy(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    formData.append('description', description);

    try {
      const res = await api.post<{ content: ContentItem }>('/content/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: `Uploaded to "${res.data.content.type}" folder successfully.` });
      setTitle('');
      setDescription('');
      setFile(null);
      e.currentTarget.reset();
      onUploaded?.(res.data.content);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Upload failed' });
    } finally {
      setBusy(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>): void {
    setFile(e.target.files?.[0] ?? null);
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>Upload Content</h3>
      <p className="muted">
        Accepted: PPT / PPTX, PDF, MP4 / MOV / AVI / MKV / WEBM. Files are automatically routed
        into the matching <code>ppt/</code>, <code>video/</code>, or <code>pdf/</code> folder on the server.
      </p>

      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Module 1 - Check-in Procedures" />
      </label>

      <label>
        Description (optional)
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </label>

      <label>
        File
        <input type="file" accept={ACCEPTED} onChange={handleFileChange} required />
      </label>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}
