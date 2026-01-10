import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TemplateCategory = 'purchase' | 'sale' | 'inventory' | 'production' | 'crm' | 'financial';
export type TemplateType = 'document' | 'email';

export interface DocumentTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  template_type: TemplateType;
  description: string | null;
  document_html: string | null;
  document_file_path: string | null;
  document_file_url: string | null;
  email_subject: string | null;
  email_html: string | null;
  email_file_path: string | null;
  email_file_url: string | null;
  send_to_primary_contact: boolean;
  send_to_all_contacts: boolean;
  bcc_addresses: string[] | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MergeField {
  id: string;
  category: TemplateCategory;
  field_key: string;
  field_label: string;
  description: string | null;
  sample_value: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface CreateTemplateInput {
  name: string;
  category: TemplateCategory;
  template_type: TemplateType;
  description?: string;
  document_html?: string;
  email_subject?: string;
  email_html?: string;
  send_to_primary_contact?: boolean;
  send_to_all_contacts?: boolean;
  bcc_addresses?: string[];
  is_default?: boolean;
}

export interface UpdateTemplateInput extends Partial<CreateTemplateInput> {
  id: string;
  document_file_path?: string;
  document_file_url?: string;
  email_file_path?: string;
  email_file_url?: string;
}

export function useDocumentTemplates(category?: TemplateCategory) {
  return useQuery({
    queryKey: ['document-templates', category],
    queryFn: async () => {
      let query = supabase
        .from('document_templates')
        .select('*')
        .order('sort_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DocumentTemplate[];
    },
  });
}

export function useMergeFields(category?: TemplateCategory) {
  return useQuery({
    queryKey: ['merge-fields', category],
    queryFn: async () => {
      let query = supabase
        .from('template_merge_fields')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MergeField[];
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('document_templates')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast.success('Template created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTemplateInput) => {
      const { data, error } = await supabase
        .from('document_templates')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast.success('Template updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
}

export function useUploadTemplateFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      templateId, 
      file, 
      fileType 
    }: { 
      templateId: string; 
      file: File; 
      fileType: 'document' | 'email';
    }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${templateId}/${fileType}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('templates')
        .getPublicUrl(fileName);

      const updateField = fileType === 'document' 
        ? { document_file_path: uploadData.path, document_file_url: urlData.publicUrl }
        : { email_file_path: uploadData.path, email_file_url: urlData.publicUrl };

      const { error: updateError } = await supabase
        .from('document_templates')
        .update(updateField)
        .eq('id', templateId);

      if (updateError) throw updateError;

      return { path: uploadData.path, url: urlData.publicUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast.success('File uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload file: ${error.message}`);
    },
  });
}
