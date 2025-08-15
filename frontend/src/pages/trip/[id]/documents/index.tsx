import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTripContext } from '@/components/util/trip-context';
import { DocumentsApiClient } from '@/lib/api/documents';
import { authenticationProviderInstance } from '@/lib/authentication-provider';
import { Document, DocumentCategory, DocumentFilters } from '@/lib/api/documents';

import * as React from 'react';
import { useEffect, useState } from 'react';

import { 
  Download, 
  Edit, 
  Eye, 
  FileText, 
  Filter, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash2, 
  Upload,
  MessageSquare
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export default function TripDocumentsPage() {
  const { selectedTrip, trips, isLoading } = useTripContext();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [filters, setFilters] = useState<DocumentFilters>({
    visibility: searchParams.get('visibility') as 'private' | 'shared' | undefined,
    category: searchParams.get('category') ? parseInt(searchParams.get('category')!) : undefined,
    search: searchParams.get('search') || undefined,
    file_type: searchParams.get('file_type') || undefined,
  });

  const documentsApiClient = new DocumentsApiClient(authenticationProviderInstance);

  useEffect(() => {
    if (selectedTrip?.id) {
      loadDocuments();
      loadCategories();
    }
  }, [selectedTrip?.id, filters]);

  const loadDocuments = async () => {
    if (!selectedTrip?.id) return;
    
    try {
      setIsLoadingDocuments(true);
      const docs = await documentsApiClient.listDocuments(selectedTrip.id, filters);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await documentsApiClient.getDocumentCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleFilterChange = (key: keyof DocumentFilters, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const newSearchParams = new URLSearchParams(searchParams);
    if (value !== undefined && value !== '') {
      newSearchParams.set(key, value.toString());
    } else {
      newSearchParams.delete(key);
    }
    setSearchParams(newSearchParams);
  };

  const handleSearch = (searchTerm: string) => {
    handleFilterChange('search', searchTerm || undefined);
  };

  const handleViewDocument = (document: Document) => {
    // For now, just download the document
    // In the future, this could open a preview modal
    handleDownloadDocument(document);
  };

  const handleDownloadDocument = (document: Document) => {
    if (document.file_url) {
      const link = document.createElement('a');
      link.href = document.file_url;
      link.download = document.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error('No file URL available for download');
    }
  };

  const handleEditDocument = (document: Document) => {
    // Navigate to edit page or open edit modal
    console.log('Edit document:', document.id);
    // TODO: Implement edit functionality
  };

  const handleViewComments = (document: Document) => {
    // Open comments modal or navigate to comments page
    console.log('View comments for document:', document.id);
    // TODO: Implement comments view
  };

  const handleDeleteDocument = async (document: Document) => {
    if (window.confirm(`Are you sure you want to delete "${document.title}"?`)) {
      try {
        await documentsApiClient.deleteDocument(selectedTrip!.id, document.id);
        // Reload documents
        loadDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'image':
        return '🖼️';
      case 'text':
        return '📝';
      case 'markdown':
        return '📝';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Show loading state while trips are being fetched
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
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
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Trips Available</h1>
          <p className="text-muted-foreground mb-6">
            You don't have any trips yet. Create a trip first to access the
            documents section.
          </p>
        </div>
      </div>
    );
  }

  // Check if a trip is selected
  if (!selectedTrip) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Trip Selected</h1>
          <p className="text-muted-foreground mb-6">
            Please select a trip from the trip switcher to view its documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
           <div>
             <h1 className="text-2xl sm:text-3xl font-bold mb-2">Documents</h1>
             <p className="text-muted-foreground">
               Manage documents for{' '}
               <span className="font-semibold">{selectedTrip.name}</span>
             </p>
           </div>
           <Link to={`/trip/${selectedTrip.id}/documents/upload`}>
             <Button className="w-full sm:w-auto">
               <Plus className="h-4 w-4 mr-2" />
               Upload Document
             </Button>
           </Link>
         </div>

                 {/* Filters and Search */}
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
                         <Select
               value={filters.visibility || 'all'}
               onValueChange={(value) => handleFilterChange('visibility', value === 'all' ? undefined : value)}
             >
               <SelectTrigger>
                 <SelectValue placeholder="All visibility" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All visibility</SelectItem>
                 <SelectItem value="shared">Shared</SelectItem>
                 <SelectItem value="private">Private</SelectItem>
               </SelectContent>
             </Select>

                         <Select
               value={filters.category?.toString() || 'all'}
               onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : parseInt(value))}
             >
               <SelectTrigger>
                 <SelectValue placeholder="All categories" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All categories</SelectItem>
                 {categories.map((category) => (
                   <SelectItem key={category.id} value={category.id.toString()}>
                     {category.name}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>

                         <Select
               value={filters.file_type || 'all'}
               onValueChange={(value) => handleFilterChange('file_type', value === 'all' ? undefined : value)}
             >
               <SelectTrigger>
                 <SelectValue placeholder="All file types" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All file types</SelectItem>
                 <SelectItem value="pdf">PDF</SelectItem>
                 <SelectItem value="image">Images</SelectItem>
                 <SelectItem value="text">Text</SelectItem>
                 <SelectItem value="markdown">Markdown</SelectItem>
                 <SelectItem value="other">Other</SelectItem>
               </SelectContent>
             </Select>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {isLoadingDocuments ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.visibility || filters.category || filters.file_type
                  ? 'Try adjusting your filters or search terms.'
                  : 'Start by uploading your first document.'}
              </p>
                             {!filters.search && !filters.visibility && !filters.category && !filters.file_type && (
                 <Link to={`/trip/${selectedTrip.id}/documents/upload`}>
                   <Button className="w-full sm:w-auto">
                     <Plus className="h-4 w-4 mr-2" />
                     Upload Document
                   </Button>
                 </Link>
               )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                             {documents.map((document) => (
                 <div key={document.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                   <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                     <div className="flex items-start space-x-4 flex-1 min-w-0">
                       <div className="text-2xl flex-shrink-0">{getFileIcon(document.file_type)}</div>
                       <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold truncate">{document.title}</h3>
                          {document.visibility === 'private' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              Private
                            </span>
                          )}
                          {document.category && (
                            <span 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: document.category.color }}
                            >
                              {document.category.name}
                            </span>
                          )}
                        </div>
                        
                        {document.description && (
                          <p className="text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                            {document.description}
                          </p>
                        )}

                                                 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                           <span>Uploaded by {document.uploaded_by.first_name || document.uploaded_by.username}</span>
                           <span className="hidden sm:inline">•</span>
                           <span>{formatFileSize(document.file_size)}</span>
                           <span className="hidden sm:inline">•</span>
                           <span>{formatDate(document.created_at)}</span>
                           {document.comment_count > 0 && (
                             <>
                               <span className="hidden sm:inline">•</span>
                               <span>{document.comment_count} comment{document.comment_count !== 1 ? 's' : ''}</span>
                             </>
                           )}
                         </div>

                        {document.custom_tags && document.custom_tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {document.custom_tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                                         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 ml-4">
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => handleViewDocument(document)}
                         className="w-full sm:w-auto"
                       >
                         <Eye className="h-4 w-4 mr-2" />
                         <span className="hidden sm:inline">View</span>
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => handleDownloadDocument(document)}
                         className="w-full sm:w-auto"
                       >
                         <Download className="h-4 w-4 mr-2" />
                         <span className="hidden sm:inline">Download</span>
                       </Button>
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="outline" size="sm" className="w-full sm:w-auto">
                             <MoreHorizontal className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => handleEditDocument(document)}>
                             <Edit className="h-4 w-4 mr-2" />
                             Edit
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleViewComments(document)}>
                             <MessageSquare className="h-4 w-4 mr-2" />
                             Comments ({document.comment_count})
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem 
                             onClick={() => handleDeleteDocument(document)}
                             className="text-red-600 focus:text-red-600"
                           >
                             <Trash2 className="h-4 w-4 mr-2" />
                             Delete
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
