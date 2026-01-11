import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, Download, Archive, ArchiveRestore } from 'lucide-react';
import { format } from 'date-fns';
import { DocumentExpiryBadge } from '@/components/approval';

interface EmployeeDocumentsProps {
  employeeId: string;
}

const DOCUMENT_TYPES = [
  { value: 'i9', label: 'I-9 Form' },
  { value: 'w4', label: 'W-4 Form' },
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'handbook_ack', label: 'Handbook Acknowledgment' },
  { value: 'background_check', label: 'Background Check' },
  { value: 'certification', label: 'Certification' },
  { value: 'other', label: 'Other' },
];

export function EmployeeDocuments({ employeeId }: EmployeeDocumentsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [documentToArchive, setDocumentToArchive] = useState<{ id: string; name: string; isExpired: boolean } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createDocument = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('employee_documents')
        .insert({
          employee_id: employeeId,
          document_type: documentType,
          document_name: documentName,
          description: description || null,
          expiry_date: expiryDate || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      toast({ title: 'Document record added' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error adding document', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleArchiveClick = (docId: string, docName: string, expiryDateStr: string | null) => {
    const isExpired = expiryDateStr ? new Date(expiryDateStr) < new Date() : false;
    if (isExpired) {
      archiveDocument(docId);
    } else {
      setDocumentToArchive({ id: docId, name: docName, isExpired });
    }
  };

  const archiveDocument = async (docId: string) => {
    const { error } = await supabase
      .from('employee_documents')
      .update({ 
        is_archived: true,
        archived_at: new Date().toISOString(),
      } as any)
      .eq('id', docId);
    
    if (error) {
      toast({ title: 'Error archiving document', description: error.message, variant: 'destructive' });
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
    toast({ title: 'Document archived' });
  };

  const restoreDocument = async (docId: string) => {
    const { error } = await supabase
      .from('employee_documents')
      .update({ 
        is_archived: false,
        archived_at: null,
      } as any)
      .eq('id', docId);
    
    if (error) {
      toast({ title: 'Error restoring document', description: error.message, variant: 'destructive' });
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
    toast({ title: 'Document restored' });
  };

  const resetForm = () => {
    setDocumentType('');
    setDocumentName('');
    setDescription('');
    setExpiryDate('');
  };

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  // Filter documents based on archived status
  const filteredDocuments = documents?.filter(doc => {
    const isArchived = (doc as any).is_archived === true;
    return showArchived || !isArchived;
  }) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Documents</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-archived"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label htmlFor="show-archived" className="text-sm">Show Archived</Label>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredDocuments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const isArchived = (doc as any).is_archived === true;
                  const archivedAt = (doc as any).archived_at;
                  return (
                    <TableRow key={doc.id} className={isArchived ? 'opacity-60 bg-muted/30' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.document_name}</p>
                            {doc.description && (
                              <p className="text-xs text-muted-foreground">{doc.description}</p>
                            )}
                            {isArchived && archivedAt && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Archive className="h-3 w-3" />
                                <span>Archived on {format(new Date(archivedAt), 'MMM d, yyyy')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getDocumentTypeLabel(doc.document_type)}</TableCell>
                      <TableCell>
                        {isArchived ? (
                          <Badge variant="outline" className="gap-1">
                            <Archive className="h-3 w-3" />
                            Archived
                          </Badge>
                        ) : doc.is_signed ? (
                          <Badge className="bg-green-100 text-green-800">Signed</Badge>
                        ) : doc.is_required ? (
                          <Badge variant="destructive">Required</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.expiry_date ? (
                          <DocumentExpiryBadge expiryDate={doc.expiry_date} size="sm" />
                        ) : (
                          <span className="text-muted-foreground">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(doc.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {doc.file_url && (
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {!isArchived ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleArchiveClick(doc.id, doc.document_name, doc.expiry_date)}
                            >
                              <Archive className="h-4 w-4 mr-1" />
                              Archive
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => restoreDocument(doc.id)}
                            >
                              <ArchiveRestore className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Add HR documents like I-9, W-4, offer letters, etc.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Document Name *</Label>
              <Input
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g., I-9 Form 2024"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes about this document"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createDocument.mutate()}
                disabled={!documentType || !documentName || createDocument.isPending}
              >
                Add Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Non-Expired Document Confirmation Dialog */}
      <AlertDialog open={!!documentToArchive} onOpenChange={(open) => !open && setDocumentToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This document has not expired yet. Are you sure you want to archive "{documentToArchive?.name || 'this document'}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (documentToArchive) {
                  archiveDocument(documentToArchive.id);
                }
                setDocumentToArchive(null);
              }}
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}