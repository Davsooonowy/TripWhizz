export const DOCUMENT_FILE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All file types' },
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Images' },
  { value: 'text', label: 'Text' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'other', label: 'Other' },
];

export const ALLOWED_DOCUMENT_EXTENSIONS: string[] = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'txt',
  'md',
];

export const MAX_DOCUMENT_SIZE_MB = 50;

export const DOCUMENT_VISIBILITY_OPTIONS: { value: 'shared' | 'private'; label: string }[] = [
  { value: 'shared', label: 'Shared - Visible to all trip members' },
  { value: 'private', label: 'Private - Only visible to you' },
];


