import { useState, useRef } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Upload,
  Camera,
  FileText,
  Plus,
  Trash2,
  Loader2,
  ImageIcon,
} from 'lucide-react';
import {
  useProductionLotQATests,
  useRequiredTestsForLot,
  useRecordQATest,
  useVerifyQATest,
  useBulkVerifyQATests,
  ProductionLotWithQA,
} from '@/hooks/useBatchQATesting';
import { useQualityTestTemplates, QualityTestTemplate } from '@/hooks/useQualityTests';
import { uploadQATestPhoto, uploadQATestDocument, getFileNameFromUrl, isImageUrl } from '@/lib/qaFileUpload';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lot: ProductionLotWithQA;
}

interface NewTestForm {
  test_template_id: string | null;
  test_name: string;
  parameter_type: string;
  test_value_numeric: number | null;
  test_value_text: string | null;
  passed: boolean | null;
  target_value: string | null;
  min_value: number | null;
  max_value: number | null;
  uom: string | null;
  notes: string;
  corrective_action: string;
  photo_files: File[];
  document_files: File[];
}

const initialTestForm: NewTestForm = {
  test_template_id: null,
  test_name: '',
  parameter_type: 'numeric',
  test_value_numeric: null,
  test_value_text: null,
  passed: null,
  target_value: null,
  min_value: null,
  max_value: null,
  uom: null,
  notes: '',
  corrective_action: '',
  photo_files: [],
  document_files: [],
};

export function QATestRecordingDialog({ open, onOpenChange, lot }: Props) {
  const [newTest, setNewTest] = useState<NewTestForm>(initialTestForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const { data: existingTests, isLoading: testsLoading } = useProductionLotQATests(lot.id);
  const { data: requiredTests } = useRequiredTestsForLot(lot.id, lot.product?.id || null);
  const { data: templates } = useQualityTestTemplates({ isActive: true });
  const recordTest = useRecordQATest();
  const verifyTest = useVerifyQATest();
  const bulkVerify = useBulkVerifyQATests();

  const completedTestNames = new Set(existingTests?.map((t) => t.test_name) || []);
  const unverifiedTests = existingTests?.filter((t) => !t.verified_at) || [];

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      setNewTest({
        ...initialTestForm,
        test_template_id: template.id,
        test_name: template.test_name,
        parameter_type: template.parameter_type,
        target_value: template.target_value,
        min_value: template.min_value,
        max_value: template.max_value,
        uom: template.uom,
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewTest((prev) => ({
      ...prev,
      photo_files: [...prev.photo_files, ...files],
    }));
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewTest((prev) => ({
      ...prev,
      document_files: [...prev.document_files, ...files],
    }));
  };

  const removePhotoFile = (index: number) => {
    setNewTest((prev) => ({
      ...prev,
      photo_files: prev.photo_files.filter((_, i) => i !== index),
    }));
  };

  const removeDocFile = (index: number) => {
    setNewTest((prev) => ({
      ...prev,
      document_files: prev.document_files.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitTest = async () => {
    if (!newTest.test_name) {
      toast.error('Please select a test or enter a test name');
      return;
    }

    // Check if pass/fail test needs a value
    if (newTest.parameter_type === 'pass_fail' && newTest.passed === null) {
      toast.error('Please select Pass or Fail');
      return;
    }

    // Check if failed test needs corrective action
    const isFailed = newTest.passed === false || (
      newTest.parameter_type === 'numeric' &&
      newTest.test_value_numeric !== null &&
      ((newTest.min_value !== null && newTest.test_value_numeric < newTest.min_value) ||
       (newTest.max_value !== null && newTest.test_value_numeric > newTest.max_value))
    );

    if (isFailed && !newTest.corrective_action.trim()) {
      toast.error('Corrective action is required for failed tests');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate a temporary ID for file uploads
      const tempTestId = `temp-${Date.now()}`;

      // Upload files
      let photoUrls: string[] = [];
      let documentUrls: string[] = [];

      if (newTest.photo_files.length > 0) {
        photoUrls = await Promise.all(
          newTest.photo_files.map((file) => uploadQATestPhoto(lot.id, tempTestId, file))
        );
      }

      if (newTest.document_files.length > 0) {
        documentUrls = await Promise.all(
          newTest.document_files.map((file) => uploadQATestDocument(lot.id, tempTestId, file))
        );
      }

      await recordTest.mutateAsync({
        production_lot_id: lot.id,
        test_template_id: newTest.test_template_id,
        test_name: newTest.test_name,
        parameter_type: newTest.parameter_type,
        test_value_numeric: newTest.test_value_numeric,
        test_value_text: newTest.test_value_text,
        passed: newTest.passed,
        target_value: newTest.target_value,
        min_value: newTest.min_value,
        max_value: newTest.max_value,
        uom: newTest.uom,
        notes: newTest.notes || null,
        corrective_action: newTest.corrective_action || null,
        photo_urls: photoUrls.length > 0 ? photoUrls : null,
        document_urls: documentUrls.length > 0 ? documentUrls : null,
      });

      setNewTest(initialTestForm);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyTest = async (testId: string) => {
    await verifyTest.mutateAsync({ id: testId, lotId: lot.id });
  };

  const handleBulkVerify = async () => {
    if (unverifiedTests.length === 0) return;
    await bulkVerify.mutateAsync({
      testIds: unverifiedTests.map((t) => t.id),
      lotId: lot.id,
    });
  };

  const getTestResult = (test: NewTestForm) => {
    if (test.parameter_type === 'pass_fail') {
      return test.passed;
    }
    if (test.parameter_type === 'numeric' && test.test_value_numeric !== null) {
      const value = test.test_value_numeric;
      if (test.min_value !== null && test.max_value !== null) {
        return value >= test.min_value && value <= test.max_value;
      }
      if (test.min_value !== null) return value >= test.min_value;
      if (test.max_value !== null) return value <= test.max_value;
    }
    return null;
  };

  const currentResult = getTestResult(newTest);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Record QA Tests
            <Badge variant="outline" className="font-mono">
              {lot.lot_number}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {lot.product?.name} • {lot.production_stage} stage • Produced: {format(new Date(lot.production_date), 'PP')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4">
          {/* Left: New Test Form */}
          <div className="border rounded-lg p-4 space-y-4 overflow-y-auto">
            <h3 className="font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Record New Test
            </h3>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Select Test Template</Label>
              <Select
                value={newTest.test_template_id || ''}
                onValueChange={handleTemplateSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a test..." />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.test_name}
                      {completedTestNames.has(t.test_name) && (
                        <span className="ml-2 text-green-600">✓</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newTest.test_name && (
              <>
                <Separator />

                {/* Test Info Display */}
                <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
                  <div className="font-medium">{newTest.test_name}</div>
                  <div className="text-muted-foreground">
                    Type: {newTest.parameter_type}
                    {newTest.target_value && ` • Target: ${newTest.target_value}`}
                    {newTest.uom && ` ${newTest.uom}`}
                  </div>
                  {(newTest.min_value !== null || newTest.max_value !== null) && (
                    <div className="text-muted-foreground">
                      Range: {newTest.min_value ?? '-'} - {newTest.max_value ?? '-'} {newTest.uom}
                    </div>
                  )}
                </div>

                {/* Value Input based on type */}
                {newTest.parameter_type === 'numeric' && (
                  <div className="space-y-2">
                    <Label>Measured Value</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="any"
                        placeholder="Enter value..."
                        value={newTest.test_value_numeric ?? ''}
                        onChange={(e) =>
                          setNewTest({
                            ...newTest,
                            test_value_numeric: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        className={cn(
                          currentResult === false && 'border-destructive',
                          currentResult === true && 'border-green-500'
                        )}
                      />
                      {newTest.uom && <span className="text-sm text-muted-foreground">{newTest.uom}</span>}
                      {currentResult !== null && (
                        currentResult ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )
                      )}
                    </div>
                  </div>
                )}

                {newTest.parameter_type === 'pass_fail' && (
                  <div className="space-y-2">
                    <Label>Result</Label>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={newTest.passed === true ? 'default' : 'outline'}
                        className={cn(newTest.passed === true && 'bg-green-600 hover:bg-green-700')}
                        onClick={() => setNewTest({ ...newTest, passed: true })}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Pass
                      </Button>
                      <Button
                        type="button"
                        variant={newTest.passed === false ? 'destructive' : 'outline'}
                        onClick={() => setNewTest({ ...newTest, passed: false })}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Fail
                      </Button>
                    </div>
                  </div>
                )}

                {newTest.parameter_type === 'text' && (
                  <div className="space-y-2">
                    <Label>Observation</Label>
                    <Textarea
                      placeholder="Enter observation..."
                      value={newTest.test_value_text || ''}
                      onChange={(e) => setNewTest({ ...newTest, test_value_text: e.target.value })}
                    />
                  </div>
                )}

                {/* Corrective Action (shown if failed) */}
                {(currentResult === false || newTest.passed === false) && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      Corrective Action Required
                    </Label>
                    <Textarea
                      placeholder="Describe the corrective action taken..."
                      value={newTest.corrective_action}
                      onChange={(e) => setNewTest({ ...newTest, corrective_action: e.target.value })}
                      className="border-destructive"
                    />
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    placeholder="Additional notes..."
                    value={newTest.notes}
                    onChange={(e) => setNewTest({ ...newTest, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                {/* File Uploads */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Add Photo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => docInputRef.current?.click()}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Add Document
                    </Button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      multiple
                      className="hidden"
                      onChange={handleDocUpload}
                    />
                  </div>

                  {newTest.photo_files.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newTest.photo_files.map((file, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="h-16 w-16 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removePhotoFile(i)}
                            className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {newTest.document_files.length > 0 && (
                    <div className="space-y-1">
                      {newTest.document_files.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4" />
                          <span className="flex-1 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeDocFile(i)}
                            className="text-destructive hover:underline text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmitTest}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Test Result'
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Right: Recorded Tests */}
          <div className="border rounded-lg p-4 space-y-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Recorded Tests</h3>
              {unverifiedTests.length > 0 && (
                <Button size="sm" variant="outline" onClick={handleBulkVerify}>
                  Verify All ({unverifiedTests.length})
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1">
              {testsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : existingTests?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tests recorded yet
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {existingTests?.map((test) => (
                    <Card key={test.id} className={cn(
                      'relative',
                      test.out_of_spec && 'border-destructive'
                    )}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {test.test_name}
                              {test.passed === true && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                              {test.passed === false && (
                                <XCircle className="h-4 w-4 text-destructive" />
                              )}
                              {test.out_of_spec && (
                                <Badge variant="destructive" className="text-xs">Out of Spec</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {test.parameter_type === 'numeric' && test.test_value_numeric !== null && (
                                <span>Value: {test.test_value_numeric} {test.uom}</span>
                              )}
                              {test.parameter_type === 'pass_fail' && (
                                <span>{test.passed ? 'Passed' : 'Failed'}</span>
                              )}
                              {test.parameter_type === 'text' && test.test_value_text && (
                                <span>{test.test_value_text}</span>
                              )}
                            </div>
                            {test.notes && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Notes: {test.notes}
                              </div>
                            )}
                            {test.corrective_action && (
                              <div className="text-xs text-orange-600 mt-1">
                                Corrective: {test.corrective_action}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-2">
                              Tested: {format(new Date(test.tested_at), 'PPp')}
                              {test.tested_by_profile && (
                                <span> by {test.tested_by_profile.first_name} {test.tested_by_profile.last_name}</span>
                              )}
                            </div>
                            {test.verified_at && (
                              <div className="text-xs text-green-600">
                                ✓ Verified: {format(new Date(test.verified_at), 'PPp')}
                              </div>
                            )}
                          </div>
                          {!test.verified_at && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleVerifyTest(test.id)}
                            >
                              Verify
                            </Button>
                          )}
                        </div>

                        {/* Photo/Document previews */}
                        {(test.photo_urls?.length || test.document_urls?.length) ? (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {test.photo_urls?.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={url}
                                  alt="Evidence"
                                  className="h-10 w-10 object-cover rounded border hover:opacity-80"
                                />
                              </a>
                            ))}
                            {test.document_urls?.map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <FileText className="h-3 w-3" />
                                {getFileNameFromUrl(url)}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
