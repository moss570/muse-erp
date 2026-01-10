import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, FileText, Mail, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DocumentTemplate,
  TemplateCategory,
  TemplateType,
  useCreateTemplate,
  useUpdateTemplate,
  useUploadTemplateFile,
  useMergeFields,
} from '@/hooks/useDocumentTemplates';
import { MergeFieldsPanel } from './MergeFieldsPanel';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['purchase', 'sale', 'inventory', 'production', 'crm', 'financial']),
  template_type: z.enum(['document', 'email']),
  description: z.string().optional(),
  email_subject: z.string().optional(),
  send_to_primary_contact: z.boolean().default(true),
  send_to_all_contacts: z.boolean().default(false),
  bcc_addresses: z.array(z.string()).default([]),
  is_default: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: DocumentTemplate | null;
  defaultCategory?: TemplateCategory;
}

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  purchase: 'Purchase',
  sale: 'Sale',
  inventory: 'Inventory',
  production: 'Production',
  crm: 'CRM',
  financial: 'Financial',
};

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  defaultCategory = 'purchase',
}: TemplateFormDialogProps) {
  const [bccInput, setBccInput] = useState('');
  const [activeTab, setActiveTab] = useState<'settings' | 'document' | 'email'>('settings');
  
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const uploadFile = useUploadTemplateFile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: defaultCategory,
      template_type: 'document',
      description: '',
      email_subject: '',
      send_to_primary_contact: true,
      send_to_all_contacts: false,
      bcc_addresses: [],
      is_default: false,
    },
  });

  const selectedCategory = form.watch('category');
  const selectedType = form.watch('template_type');
  const bccAddresses = form.watch('bcc_addresses');

  const { data: mergeFields = [] } = useMergeFields(selectedCategory);

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        category: template.category,
        template_type: template.template_type,
        description: template.description || '',
        email_subject: template.email_subject || '',
        send_to_primary_contact: template.send_to_primary_contact,
        send_to_all_contacts: template.send_to_all_contacts,
        bcc_addresses: template.bcc_addresses || [],
        is_default: template.is_default,
      });
    } else {
      form.reset({
        name: '',
        category: defaultCategory,
        template_type: 'document',
        description: '',
        email_subject: '',
        send_to_primary_contact: true,
        send_to_all_contacts: false,
        bcc_addresses: [],
        is_default: false,
      });
    }
  }, [template, defaultCategory, form]);

  const handleAddBcc = () => {
    if (bccInput.trim() && bccInput.includes('@')) {
      form.setValue('bcc_addresses', [...bccAddresses, bccInput.trim()]);
      setBccInput('');
    }
  };

  const handleRemoveBcc = (email: string) => {
    form.setValue('bcc_addresses', bccAddresses.filter(e => e !== email));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'document' | 'email') => {
    const file = e.target.files?.[0];
    if (!file || !template?.id) return;

    await uploadFile.mutateAsync({
      templateId: template.id,
      file,
      fileType,
    });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (template) {
        await updateTemplate.mutateAsync({
          id: template.id,
          ...values,
        });
      } else {
        await createTemplate.mutateAsync({
          name: values.name,
          category: values.category,
          template_type: values.template_type,
          description: values.description,
          email_subject: values.email_subject,
          send_to_primary_contact: values.send_to_primary_contact,
          send_to_all_contacts: values.send_to_all_contacts,
          bcc_addresses: values.bcc_addresses,
          is_default: values.is_default,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createTemplate.isPending || updateTemplate.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {template ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <div className="px-6 pt-4">
                <TabsList>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="document">
                    <FileText className="h-4 w-4 mr-1" />
                    Document
                  </TabsTrigger>
                  {selectedType === 'email' && (
                    <TabsTrigger value="email">
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <ScrollArea className="h-[60vh]">
                <TabsContent value="settings" className="p-6 pt-4 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Purchase Order" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="template_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="document">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Document Only
                                </div>
                              </SelectItem>
                              <SelectItem value="email">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  Document + Email
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose whether this template includes email functionality
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_default"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Set as Default</FormLabel>
                            <FormDescription>
                              Use this template by default for this category
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Optional description for this template..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedType === 'email' && (
                    <>
                      <Separator />
                      <h3 className="font-medium">Email Settings</h3>

                      <FormField
                        control={form.control}
                        name="email_subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Subject</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., New Order from Company - PO # {{PO_NUMBER}}"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              You can use merge fields like {'{{PO_NUMBER}}'} in the subject
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="send_to_primary_contact"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Send to Primary Contact</FormLabel>
                                <FormDescription>
                                  Automatically send to the primary contact
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="send_to_all_contacts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Send to All Contacts</FormLabel>
                                <FormDescription>
                                  Send to all company contacts
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormItem>
                        <FormLabel>BCC Addresses</FormLabel>
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            placeholder="Add BCC email address"
                            value={bccInput}
                            onChange={(e) => setBccInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddBcc();
                              }
                            }}
                          />
                          <Button type="button" variant="secondary" onClick={handleAddBcc}>
                            Add
                          </Button>
                        </div>
                        {bccAddresses.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {bccAddresses.map((email) => (
                              <Badge key={email} variant="secondary" className="gap-1">
                                {email}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBcc(email)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </FormItem>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="document" className="p-6 pt-4">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Upload Document Template</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload a Word document (.docx) or HTML file. Use merge fields like{' '}
                          <code className="bg-muted px-1 rounded">{'{{PO_NUMBER}}'}</code> in your template.
                        </p>
                        
                        {template?.document_file_url ? (
                          <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">Template uploaded</p>
                              <p className="text-xs text-muted-foreground">
                                {template.document_file_path?.split('/').pop()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <a href={template.document_file_url} target="_blank" rel="noopener noreferrer">
                                  Download
                                </a>
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('doc-upload')?.click()}
                              >
                                Replace
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={() => document.getElementById('doc-upload')?.click()}
                          >
                            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                            <p className="font-medium">Click to upload document template</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Supports .docx, .html files
                            </p>
                          </div>
                        )}
                        
                        <input
                          id="doc-upload"
                          type="file"
                          accept=".docx,.html,.htm"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'document')}
                          disabled={!template?.id}
                        />

                        {!template?.id && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Save the template first to enable file uploads
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <MergeFieldsPanel fields={mergeFields} />
                    </div>
                  </div>
                </TabsContent>

                {selectedType === 'email' && (
                  <TabsContent value="email" className="p-6 pt-4">
                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-2 space-y-4">
                        <div>
                          <h3 className="font-medium mb-2">Email Template</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Upload an HTML email template or the system will use a default layout.
                          </p>

                          {template?.email_file_url ? (
                            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                              <Mail className="h-8 w-8 text-muted-foreground" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">Email template uploaded</p>
                                <p className="text-xs text-muted-foreground">
                                  {template.email_file_path?.split('/').pop()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a href={template.email_file_url} target="_blank" rel="noopener noreferrer">
                                    Download
                                  </a>
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => document.getElementById('email-upload')?.click()}
                                >
                                  Replace
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                              onClick={() => document.getElementById('email-upload')?.click()}
                            >
                              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                              <p className="font-medium">Click to upload email template</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Supports .html files
                              </p>
                            </div>
                          )}

                          <input
                            id="email-upload"
                            type="file"
                            accept=".html,.htm"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'email')}
                            disabled={!template?.id}
                          />

                          {!template?.id && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Save the template first to enable file uploads
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <MergeFieldsPanel fields={mergeFields} />
                      </div>
                    </div>
                  </TabsContent>
                )}
              </ScrollArea>
            </Tabs>

            <Separator />
            
            <div className="flex justify-end gap-2 p-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (template ? 'Save Changes' : 'Create Template')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
