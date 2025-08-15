import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useTripContext } from '@/components/util/trip-context';
import { DocumentsApiClient } from '@/lib/api/documents';
import { DocumentCategory } from '@/lib/api/documents';
import { authenticationProviderInstance } from '@/lib/authentication-provider';

import * as React from 'react';
import { useEffect, useState } from 'react';

import { ArrowLeft, FileText, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DocumentUploadPage() {
  const { selectedTrip, trips, isLoading } = useTripContext();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null as File | null,
    visibility: 'shared' as 'private' | 'shared',
    category: 'none',
    customTags: '',
    autoDeleteAfterTrip: false,
    deleteDaysAfterTrip: 30,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  const documentsApiClient = new DocumentsApiClient(
    authenticationProviderInstance,
  );

  useEffect(() => {
    if (selectedTrip?.id) {
      loadCategories();
    }
  }, [selectedTrip?.id]);

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      console.log('Loading document categories...');
      const cats = await documentsApiClient.getDocumentCategories();
      console.log('Categories loaded:', cats);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors((prev) => ({ ...prev, file: 'File size must be under 50MB' }));
      return;
    }

    // Validate file type
    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'md'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      setErrors((prev) => ({ ...prev, file: 'File type not supported' }));
      return;
    }

    setFormData((prev) => ({ ...prev, file }));
    setErrors((prev) => ({ ...prev, file: '' }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.file) {
      newErrors.file = 'Please select a file';
    }

    if (formData.autoDeleteAfterTrip && formData.deleteDaysAfterTrip < 1) {
      newErrors.deleteDaysAfterTrip = 'Days must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !selectedTrip?.id || !formData.file) return;

    try {
      setIsUploading(true);
      console.log('Starting document upload...');
      console.log('Trip ID:', selectedTrip.id);
      console.log('Form data:', formData);

      const customTags = formData.customTags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const uploadData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        file: formData.file,
        visibility: formData.visibility,
        category:
          formData.category && formData.category !== 'none'
            ? parseInt(formData.category)
            : undefined,
        custom_tags: customTags.length > 0 ? customTags : undefined,
        auto_delete_after_trip: formData.autoDeleteAfterTrip,
        delete_days_after_trip: formData.autoDeleteAfterTrip
          ? formData.deleteDaysAfterTrip
          : undefined,
      };

      console.log('Upload data:', uploadData);

      const result = await documentsApiClient.createDocument(
        selectedTrip.id,
        uploadData,
      );
      console.log('Upload successful:', result);

      // Navigate back to documents list
      navigate(`/trip/${selectedTrip.id}/documents`);
    } catch (error) {
      console.error('Error uploading document:', error);
      setErrors((prev) => ({
        ...prev,
        submit: 'Failed to upload document. Please try again.',
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFormData((prev) => ({ ...prev, file: null }));
    setErrors((prev) => ({ ...prev, file: '' }));
  };

  // Show loading state while trips are being fetched
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Loading trip information...</p>
        </div>
      </div>
    );
  }

  // Check if we have any trips at all
  if (trips.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Trips Available</h1>
          <p className="text-muted-foreground mb-6">
            You don't have any trips yet. Create a trip first to upload
            documents.
          </p>
        </div>
      </div>
    );
  }

  // Check if a trip is selected
  if (!selectedTrip) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Trip Selected</h1>
          <p className="text-muted-foreground mb-6">
            Please select a trip from the trip switcher to upload documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/trip/${selectedTrip.id}/documents`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Button>

        <h1 className="text-3xl font-bold mb-2">Upload Document</h1>
        <p className="text-muted-foreground">
          Add a new document to{' '}
          <span className="font-semibold">{selectedTrip.name}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="file">Document File *</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {formData.file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <span className="font-medium">{formData.file.name}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeFile}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium">
                    Drop your file here or{' '}
                    <label
                      htmlFor="file"
                      className="text-primary cursor-pointer hover:underline"
                    >
                      browse
                    </label>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports PDF, images, and text files up to 50MB
                  </p>
                </div>
                <input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.txt,.md"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileSelect(e.target.files[0])
                  }
                  className="hidden"
                />
              </div>
            )}
          </div>
          {errors.file && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.file}
            </p>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter document title"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Optional description of the document"
            rows={3}
          />
        </div>

        {/* Visibility and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value) => handleInputChange('visibility', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shared">
                  Shared - Visible to all trip members
                </SelectItem>
                <SelectItem value="private">
                  Private - Only visible to you
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category || 'none'}
              onValueChange={(value) =>
                handleInputChange('category', value === 'none' ? '' : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {isLoadingCategories ? (
                  <SelectItem value="loading" disabled>
                    Loading categories...
                  </SelectItem>
                ) : (
                  categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Tags */}
        <div className="space-y-2">
          <Label htmlFor="customTags">Custom Tags</Label>
          <Input
            id="customTags"
            value={formData.customTags}
            onChange={(e) => handleInputChange('customTags', e.target.value)}
            placeholder="e.g., Day 1, Visa, Food (separate with commas)"
          />
          <p className="text-sm text-gray-500">
            Add custom tags to help organize your documents
          </p>
        </div>

        {/* Auto-delete Options */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="autoDelete"
              checked={formData.autoDeleteAfterTrip}
              onCheckedChange={(checked) =>
                handleInputChange('autoDeleteAfterTrip', checked)
              }
            />
            <Label htmlFor="autoDelete">Auto-delete after trip ends</Label>
          </div>

          {formData.autoDeleteAfterTrip && (
            <div className="space-y-2 ml-6">
              <Label htmlFor="deleteDays">Delete after (days)</Label>
              <Input
                id="deleteDays"
                type="number"
                min="1"
                max="365"
                value={formData.deleteDaysAfterTrip}
                onChange={(e) =>
                  handleInputChange(
                    'deleteDaysAfterTrip',
                    parseInt(e.target.value),
                  )
                }
                className="w-32"
              />
              {errors.deleteDaysAfterTrip && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.deleteDaysAfterTrip}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.submit}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex space-x-4">
          <Button
            type="submit"
            disabled={isUploading || !formData.file}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/trip/${selectedTrip.id}/documents`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
