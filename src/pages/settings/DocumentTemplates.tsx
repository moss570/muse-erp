import { useState } from 'react';
import { FileText, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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
import { SettingsBreadcrumb } from '@/components/settings/SettingsBreadcrumb';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { NewTemplateCard } from '@/components/templates/NewTemplateCard';
import { TemplateFormDialog } from '@/components/templates/TemplateFormDialog';
import { MergeFieldsPanel } from '@/components/templates/MergeFieldsPanel';
import {
  DocumentTemplate,
  TemplateCategory,
  useDocumentTemplates,
  useDeleteTemplate,
  useUpdateTemplate,
  useMergeFields,
} from '@/hooks/useDocumentTemplates';

const CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: 'purchase', label: 'Purchase' },
  { value: 'sale', label: 'Sale' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'production', label: 'Production' },
  { value: 'crm', label: 'CRM' },
  { value: 'financial', label: 'Financial' },
];

export default function DocumentTemplates() {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('purchase');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMergeFields, setShowMergeFields] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<DocumentTemplate | null>(null);

  const { data: templates = [], isLoading } = useDocumentTemplates(selectedCategory);
  const { data: mergeFields = [] } = useMergeFields(selectedCategory);
  const deleteMutation = useDeleteTemplate();
  const updateMutation = useUpdateTemplate();

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setFormOpen(true);
  };

  const handleDelete = (template: DocumentTemplate) => {
    setDeleteTemplate(template);
  };

  const confirmDelete = async () => {
    if (deleteTemplate) {
      await deleteMutation.mutateAsync(deleteTemplate.id);
      setDeleteTemplate(null);
    }
  };

  const handleSetDefault = async (template: DocumentTemplate) => {
    // First, unset any existing defaults for this category
    const currentDefaults = templates.filter(t => t.is_default && t.id !== template.id);
    
    for (const t of currentDefaults) {
      await updateMutation.mutateAsync({ id: t.id, is_default: false });
    }
    
    // Then set this one as default
    await updateMutation.mutateAsync({ id: template.id, is_default: true });
  };

  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <SettingsBreadcrumb currentPage="Document & Email Templates" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document & Email Templates</h1>
          <p className="text-muted-foreground">
            Manage document templates and email layouts. Download any template, modify it as you like, keeping merge fields, then upload it back.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowMergeFields(!showMergeFields)}
          className="shrink-0"
        >
          <List className="h-4 w-4 mr-2" />
          {showMergeFields ? 'Hide' : 'Show'} Merge Fields
        </Button>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as TemplateCategory)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="h-auto flex-wrap">
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
      </Tabs>

      {/* Main Content */}
      <div className={`grid gap-6 ${showMergeFields ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1'}`}>
        {/* Templates Grid */}
        <div className={showMergeFields ? 'lg:col-span-3' : ''}>
          {isLoading ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[3/4] rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              <NewTemplateCard onClick={handleNewTemplate} />
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                />
              ))}
            </div>
          )}

          {!isLoading && filteredTemplates.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No templates found matching "{searchQuery}"
              </p>
            </div>
          )}
        </div>

        {/* Merge Fields Panel */}
        {showMergeFields && (
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <MergeFieldsPanel fields={mergeFields} />
            </div>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <TemplateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        template={selectedTemplate}
        defaultCategory={selectedCategory}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTemplate} onOpenChange={() => setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTemplate?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
