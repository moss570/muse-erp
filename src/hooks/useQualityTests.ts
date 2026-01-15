import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface QualityTestTemplate {
  id: string;
  test_name: string;
  test_code: string;
  description: string | null;
  category: string | null;
  test_method: string | null;
  parameter_type: string;
  target_value: string | null;
  min_value: number | null;
  max_value: number | null;
  uom: string | null;
  required_equipment: string | null;
  typical_duration_minutes: number | null;
  applicable_stages: string[] | null;
  is_critical: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface QualityTestTemplateInput {
  test_name: string;
  test_code: string;
  description?: string | null;
  category?: string | null;
  test_method?: string | null;
  parameter_type: string;
  target_value?: string | null;
  min_value?: number | null;
  max_value?: number | null;
  uom?: string | null;
  required_equipment?: string | null;
  typical_duration_minutes?: number | null;
  applicable_stages?: string[] | null;
  is_critical?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

interface QualityTestFilters {
  category?: string;
  stage?: string;
  isActive?: boolean;
  isCritical?: boolean;
  search?: string;
}

export function useQualityTestTemplates(filters?: QualityTestFilters) {
  return useQuery({
    queryKey: ['quality-test-templates', filters],
    queryFn: async () => {
      let query = supabase
        .from('quality_test_templates')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('test_name', { ascending: true });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters?.isCritical !== undefined) {
        query = query.eq('is_critical', filters.isCritical);
      }
      if (filters?.stage) {
        query = query.contains('applicable_stages', [filters.stage]);
      }
      if (filters?.search) {
        query = query.or(`test_name.ilike.%${filters.search}%,test_code.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as QualityTestTemplate[];
    },
  });
}

export function useQualityTestTemplate(id: string | null) {
  return useQuery({
    queryKey: ['quality-test-template', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('quality_test_templates')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as QualityTestTemplate;
    },
    enabled: !!id,
  });
}

export function useCreateQualityTestTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: QualityTestTemplateInput) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('quality_test_templates')
        .insert({
          ...input,
          created_by: user?.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-test-templates'] });
      toast.success('Test template created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create test template: ${error.message}`);
    },
  });
}

export function useUpdateQualityTestTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: QualityTestTemplateInput & { id: string }) => {
      const { data, error } = await supabase
        .from('quality_test_templates')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-test-templates'] });
      toast.success('Test template updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update test template: ${error.message}`);
    },
  });
}

export function useDeleteQualityTestTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quality_test_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-test-templates'] });
      toast.success('Test template deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete test template: ${error.message}`);
    },
  });
}

// Generate next test code
export function useGenerateTestCode(category: string | null) {
  return useQuery({
    queryKey: ['generate-test-code', category],
    queryFn: async () => {
      if (!category) return null;
      
      const prefix = category.substring(0, 3).toUpperCase();
      const { data, error } = await supabase
        .from('quality_test_templates')
        .select('test_code')
        .ilike('test_code', `${prefix}-%`)
        .order('test_code', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      let nextNum = 1;
      if (data && data.length > 0) {
        const lastCode = data[0].test_code;
        const match = lastCode.match(/-(\d+)$/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      
      return `${prefix}-${String(nextNum).padStart(4, '0')}`;
    },
    enabled: !!category,
  });
}

export const TEST_CATEGORIES = [
  { value: 'microbiological', label: 'Microbiological' },
  { value: 'physical', label: 'Physical' },
  { value: 'chemical', label: 'Chemical' },
  { value: 'sensory', label: 'Sensory' },
  { value: 'safety', label: 'Safety' },
] as const;

export const PARAMETER_TYPES = [
  { value: 'numeric', label: 'Numeric Value' },
  { value: 'pass_fail', label: 'Pass / Fail' },
  { value: 'text', label: 'Text Entry' },
  { value: 'range', label: 'Range (Min/Max)' },
] as const;

export const APPLICABLE_STAGES = [
  { value: 'base', label: 'Base' },
  { value: 'flavoring', label: 'Flavoring' },
  { value: 'finished', label: 'Finished' },
] as const;

export const TEST_FREQUENCIES = [
  { value: 'per_batch', label: 'Per Batch' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
] as const;
