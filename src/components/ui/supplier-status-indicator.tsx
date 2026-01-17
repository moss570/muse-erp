/**
 * Supplier Status Indicator Utilities
 * 
 * Provides consistent styling and logic for supplier approval status across the app.
 * 
 * Status mapping:
 * - Approved: Normal appearance (no highlight)
 * - Probation: Yellow/amber background
 * - Draft, Pending_QA, Rejected, Archived: Red background
 */

export type SupplierApprovalStatus = 
  | 'Draft' 
  | 'Pending_QA' 
  | 'Probation' 
  | 'Approved' 
  | 'Rejected' 
  | 'Archived';

/**
 * Get CSS classes for styling a field based on supplier approval status.
 * Returns classes for background and border colors.
 */
export function getSupplierFieldStyles(approvalStatus: string | null | undefined): string {
  const status = approvalStatus?.toLowerCase();
  
  if (status === 'approved') {
    return '';
  }
  
  if (status === 'probation') {
    return 'bg-amber-100 border-amber-400 dark:bg-amber-900/30 dark:border-amber-600';
  }
  
  // Draft, Pending_QA, Rejected, Archived, or any other non-approved status
  return 'bg-red-100 border-red-400 dark:bg-red-900/30 dark:border-red-600';
}

/**
 * Get CSS classes for styling a dropdown item based on supplier approval status.
 * Lighter styling for dropdown items to maintain readability.
 */
export function getSupplierItemStyles(approvalStatus: string | null | undefined): string {
  const status = approvalStatus?.toLowerCase();
  
  if (status === 'approved') {
    return '';
  }
  
  if (status === 'probation') {
    return 'bg-amber-50 dark:bg-amber-900/20';
  }
  
  // Draft, Pending_QA, Rejected, Archived, or any other non-approved status
  return 'bg-red-50 dark:bg-red-900/20';
}

/**
 * Check if a warning should be shown for the given supplier approval status.
 * Returns true for any status that is not 'approved'.
 */
export function shouldShowSupplierWarning(approvalStatus: string | null | undefined): boolean {
  const status = approvalStatus?.toLowerCase();
  return status !== 'approved';
}

/**
 * Get a human-readable label for the approval status.
 */
export function getApprovalStatusLabel(approvalStatus: string | null | undefined): string {
  if (!approvalStatus) return 'Unknown';
  
  const statusMap: Record<string, string> = {
    'draft': 'Draft',
    'pending_qa': 'Pending QA',
    'probation': 'Probation',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'archived': 'Archived',
  };
  
  return statusMap[approvalStatus.toLowerCase()] || approvalStatus;
}
