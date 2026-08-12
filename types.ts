export type Role = 'super-admin' | 'admin' | 'learner';
export type ContentType = 'ppt' | 'video' | 'pdf';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface ContentUploader {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface ContentItem {
  _id: string;
  title: string;
  description: string;
  type: ContentType;
  fileName: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: ContentUploader | null;
  createdAt: string;
  updatedAt: string;
}
