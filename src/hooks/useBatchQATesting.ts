import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductionLotQATest {
  id: string;
  production_lot_id: string;
  test_template_id: string | null;
  test_name: string;
  parameter_type: string;
  test_value_numeric: number | null;
  test_value_text: string | null;
  passed: boolean | null;
  out_of_spec: boolean;
  tested_at: string;
  tested_by: string | null;
  verified_by: string | null;
  verified_at: string | null;
  target_value: string | null;
  min_value: number | null;
  max_value: number | null;
  uom: string | null;
  notes: string | null;
  corrective_action: string | null;
  photo_urls: string[] | null;
  document_urls: string[] | null;
  created_at: string;
  updated_at: string;
  tested_by_profile?: { first_name: string | null; last_name: string | null };
  verified_by_profile?: { first_name: string | null; last_name: string | null };
}

export interface RecordQATestInput {
  production_lot_id: string;
  test_template_id?: string | null;
  test_name: string;
  parameter_type: string;
  test_value_numeric?: number | null;
  test_value_text?: string | null;
  passed?: boolean | null;
  out_of_spec?: boolean;
  target_value?: string | null;
  min_value?: number | null;
  max_value?: number | null;
  uom?: string | null;
  notes?: string | null;
  corrective_action?: string | null;
  photo_urls?: string[] | null;
  document_urls?: string[] | null;
}

export interface ProductionLotWithQA {
  id: string;
  lot_number: string;
  production_date: string;
  production_stage: string;
  approval_status: string | null;
  quantity_produced: number | null;
  product: { id: string; name: string; sku: string | null } | null;
  machine: { id: string; name: string } | null;
  qa_tests_count?: number;
  required_tests_count?: number;
}

// Get QA tests for a specific production lot
export function useProductionLotQATests(lotId: string | null) {
  return useQuery({
    queryKey: ['production-lot-qa-tests', lotId],
    queryFn: async () => {
      if (!lotId) return [];
      
      const { data, error } = await supabase
        .from('production_lot_qa_tests')
        .select(`
          *,
          tested_by_profile:profiles!production_lot_qa_tests_tested_by_fkey(first_name, last_name),
          verified_by_profile:profiles!production_lot_qa_tests_verified_by_fkey(first_name, last_name)
        `)
        .eq('production_lot_id', lotId)
        .order('tested_at', { ascending: false });
      
      if (error) throw error;
      return data as ProductionLotQATest[];
    },
    enabled: !!lotId,
  });
}

// Get required tests for a lot based on product QA requirements
export function useRequiredTestsForLot(lotId: string | null, productId: string | null) {
  return useQuery({
    queryKey: ['required-tests-for-lot', lotId, productId],
    queryFn: async () => {
      if (!productId) return [] as Array<{
        id: string;
        product_id: string;
        parameter_name: string;
        is_critical: boolean | null;
        test_template_id: string | null;
        frequency: string | null;
        sample_size: string | null;
        target_value: string | null;
        min_value: number | null;
        max_value: number | null;
        uom: string | null;
      }>;
      
      const { data, error } = await supabase
        .from('product_qa_requirements')
        .select('id, product_id, parameter_name, is_critical, test_template_id, frequency, sample_size, target_value, min_value, max_value, uom')
        .eq('product_id', productId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });
}

// Get production lots pending QA or for QA testing
export function usePendingQALots(filters?: {
  date?: string;
  stage?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['pending-qa-lots', filters],
    queryFn: async () => {
      let query = supabase
        .from('production_lots')
        .select(`
          id,
          lot_number,
          production_date,
          production_stage,
          approval_status,
          quantity_produced,
          product:products(id, name, sku),
          machine:machines(id, name)
        `)
        .order('production_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.date) {
        query = query.eq('production_date', filters.date);
      }
      if (filters?.stage) {
        query = query.eq('production_stage', filters.stage);
      }
      if (filters?.status) {
        query = query.eq('approval_status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProductionLotWithQA[];
    },
  });
}

// Record a new QA test
export function useRecordQATest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RecordQATestInput) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Auto-calculate pass/fail for numeric and range types
      let passed = input.passed;
      let outOfSpec = input.out_of_spec || false;
      
      if (input.parameter_type === 'numeric' || input.parameter_type === 'range') {
        if (input.test_value_numeric !== null && input.test_value_numeric !== undefined) {
          const value = input.test_value_numeric;
          const min = input.min_value;
          const max = input.max_value;
          
          if (min !== null && max !== null) {
            passed = value >= min && value <= max;
            outOfSpec = !passed;
          } else if (min !== null) {
            passed = value >= min;
            outOfSpec = !passed;
          } else if (max !== null) {
            passed = value <= max;
            outOfSpec = !passed;
          }
        }
      }
      
      const { data, error } = await supabase
        .from('production_lot_qa_tests')
        .insert({
          ...input,
          passed,
          out_of_spec: outOfSpec,
          tested_by: user?.user?.id,
          tested_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['production-lot-qa-tests', variables.production_lot_id] });
      queryClient.invalidateQueries({ queryKey: ['pending-qa-lots'] });
      toast.success('Test recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record test: ${error.message}`);
    },
  });
}

// Update an existing QA test
export function useUpdateQATest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: RecordQATestInput & { id: string }) => {
      // Auto-calculate pass/fail for numeric and range types
      let passed = input.passed;
      let outOfSpec = input.out_of_spec || false;
      
      if (input.parameter_type === 'numeric' || input.parameter_type === 'range') {
        if (input.test_value_numeric !== null && input.test_value_numeric !== undefined) {
          const value = input.test_value_numeric;
          const min = input.min_value;
          const max = input.max_value;
          
          if (min !== null && max !== null) {
            passed = value >= min && value <= max;
            outOfSpec = !passed;
          } else if (min !== null) {
            passed = value >= min;
            outOfSpec = !passed;
          } else if (max !== null) {
            passed = value <= max;
            outOfSpec = !passed;
          }
        }
      }
      
      const { data, error } = await supabase
        .from('production_lot_qa_tests')
        .update({
          ...input,
          passed,
          out_of_spec: outOfSpec,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['production-lot-qa-tests', variables.production_lot_id] });
      toast.success('Test updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update test: ${error.message}`);
    },
  });
}

// Delete a QA test
export function useDeleteQATest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, lotId }: { id: string; lotId: string }) => {
      const { error } = await supabase
        .from('production_lot_qa_tests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { lotId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['production-lot-qa-tests', result.lotId] });
      toast.success('Test deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete test: ${error.message}`);
    },
  });
}

// Verify a QA test (for QA managers)
export function useVerifyQATest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, lotId }: { id: string; lotId: string }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('production_lot_qa_tests')
        .update({
          verified_by: user?.user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, lotId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['production-lot-qa-tests', result.lotId] });
      toast.success('Test verified successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to verify test: ${error.message}`);
    },
  });
}

// Bulk verify multiple tests
export function useBulkVerifyQATests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ testIds, lotId }: { testIds: string[]; lotId: string }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('production_lot_qa_tests')
        .update({
          verified_by: user?.user?.id,
          verified_at: new Date().toISOString(),
        })
        .in('id', testIds)
        .select();
      
      if (error) throw error;
      return { data, lotId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['production-lot-qa-tests', result.lotId] });
      toast.success(`${result.data.length} tests verified successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to verify tests: ${error.message}`);
    },
  });
}
