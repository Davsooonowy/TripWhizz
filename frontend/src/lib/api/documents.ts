import { BaseApiClient } from './base';
import { AuthenticationProvider } from '../authentication-provider';
import { API_URL } from '../config';

export interface DocumentCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface DocumentComment {
  id: number;
  document: number;
  author: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar_url?: string | null;
  };
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  trip: number;
  title: string;
  description?: string;
  file: string;
  file_url?: string;
  file_type: 'pdf' | 'image' | 'text' | 'markdown' | 'other';
  file_size: number;
  file_extension?: string;
  visibility: 'private' | 'shared';
  category?: DocumentCategory | null;
  custom_tags: string[];
  uploaded_by: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar_url?: string | null;
  };
  comments: DocumentComment[];
  comment_count: number;
  auto_delete_after_trip: boolean;
  delete_days_after_trip: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentData {
  title: string;
  description?: string;
  file: File;
  visibility: 'private' | 'shared';
  category?: number | null;
  custom_tags?: string[];
  auto_delete_after_trip?: boolean;
  delete_days_after_trip?: number;
}

export interface UpdateDocumentData {
  title?: string;
  description?: string;
  visibility?: 'private' | 'shared';
  category?: number | null;
  custom_tags?: string[];
  auto_delete_after_trip?: boolean;
  delete_days_after_trip?: number;
}

export interface CreateCommentData {
  content: string;
}

export interface UpdateCommentData {
  content: string;
}

export interface DocumentFilters {
  visibility?: 'private' | 'shared';
  category?: number;
  search?: string;
  file_type?: string;
}

export class DocumentsApiClient extends BaseApiClient {
  constructor(authenticationProvider: AuthenticationProvider) {
    super(authenticationProvider);
  }

  private url(tripId: number | string) {
    return `${API_URL}/trips/trip/${tripId}/documents/`;
  }

  async getDocumentCategories(): Promise<DocumentCategory[]> {
    const response = await fetch(`${API_URL}/trips/document-categories/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async listDocuments(
    tripId: number,
    filters?: DocumentFilters,
  ): Promise<Document[]> {
    const params = new URLSearchParams();
    
    if (filters?.visibility) {
      params.append('visibility', filters.visibility);
    }
    if (filters?.category) {
      params.append('category', filters.category.toString());
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.file_type) {
      params.append('file_type', filters.file_type);
    }

    const queryString = params.toString();
    const url = queryString ? `${this.url(tripId)}?${queryString}` : this.url(tripId);
    
    const response = await fetch(url, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async getDocument(
    tripId: number,
    documentId: number,
  ): Promise<Document> {
    const response = await fetch(`${this.url(tripId)}${documentId}/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async createDocument(
    tripId: number,
    data: CreateDocumentData,
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }
    formData.append('file', data.file);
    formData.append('visibility', data.visibility);
    if (data.category) {
      formData.append('category', data.category.toString());
    }
    if (data.custom_tags && data.custom_tags.length > 0) {
      data.custom_tags.forEach(tag => formData.append('custom_tags', tag));
    }
    if (data.auto_delete_after_trip !== undefined) {
      formData.append('auto_delete_after_trip', data.auto_delete_after_trip.toString());
    }
    if (data.delete_days_after_trip) {
      formData.append('delete_days_after_trip', data.delete_days_after_trip.toString());
    }

    // For FormData, don't set Content-Type header - let browser set it with boundary
    const config = this._requestConfiguration(true);
    delete config.headers['Content-Type'];
    
    const response = await fetch(this.url(tripId), {
      ...config,
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async updateDocument(
    tripId: number,
    documentId: number,
    data: UpdateDocumentData,
  ): Promise<Document> {
    const response = await fetch(`${this.url(tripId)}${documentId}/`, {
      ...this._requestConfiguration(true),
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async deleteDocument(tripId: number, documentId: number): Promise<void> {
    const response = await fetch(`${this.url(tripId)}${documentId}/`, {
      ...this._requestConfiguration(true),
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
  }

  async getComments(
    tripId: number,
    documentId: number,
  ): Promise<DocumentComment[]> {
    const response = await fetch(
      `${this.url(tripId)}${documentId}/comments/`,
      {
        ...this._requestConfiguration(true),
        method: 'GET',
      },
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async createComment(
    tripId: number,
    documentId: number,
    data: CreateCommentData,
  ): Promise<DocumentComment> {
    const response = await fetch(
      `${this.url(tripId)}${documentId}/comments/`,
      {
        ...this._requestConfiguration(true),
        method: 'POST',
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async updateComment(
    tripId: number,
    documentId: number,
    commentId: number,
    data: UpdateCommentData,
  ): Promise<DocumentComment> {
    const response = await fetch(
      `${this.url(tripId)}${documentId}/comments/${commentId}/`,
      {
        ...this._requestConfiguration(true),
        method: 'PUT',
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async deleteComment(
    tripId: number,
    documentId: number,
    commentId: number,
  ): Promise<void> {
    const response = await fetch(
      `${this.url(tripId)}${documentId}/comments/${commentId}/`,
      {
        ...this._requestConfiguration(true),
        method: 'DELETE',
      },
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
  }
}
