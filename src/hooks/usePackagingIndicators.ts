import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PackagingIndicatorMapping {
  id: string;
  case_pack_size: number;
  indicator_digit: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PackagingIndicatorInput {
  case_pack_size: number;
  indicator_digit: string;
  description?: string | null;
}

export function usePackagingIndicators() {
  return useQuery({
    queryKey: ['packaging-indicators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packaging_indicator_mappings')
        .select('*')
        .order('case_pack_size', { ascending: true });

      if (error) throw error;
      return data as PackagingIndicatorMapping[];
    },
  });
}

export function useCreatePackagingIndicator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PackagingIndicatorInput) => {
      const { data, error } = await supabase
        .from('packaging_indicator_mappings')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-indicators'] });
      toast({ title: 'Packaging indicator created successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating packaging indicator',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdatePackagingIndicator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: PackagingIndicatorInput & { id: string }) => {
      const { data, error } = await supabase
        .from('packaging_indicator_mappings')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-indicators'] });
      toast({ title: 'Packaging indicator updated successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating packaging indicator',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeletePackagingIndicator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('packaging_indicator_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-indicators'] });
      toast({ title: 'Packaging indicator deleted successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting packaging indicator',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Gets the packaging indicator for a specific case pack size
 */
export async function getPackagingIndicatorForSize(casePackSize: number): Promise<string> {
  const { data, error } = await supabase
    .from('packaging_indicator_mappings')
    .select('indicator_digit')
    .eq('case_pack_size', casePackSize)
    .single();

  if (error || !data) {
    // Fallback to "1" if no mapping found
    console.warn(`No packaging indicator mapping found for case pack size ${casePackSize}, using default "1"`);
    return '1';
  }

  return data.indicator_digit;
}
