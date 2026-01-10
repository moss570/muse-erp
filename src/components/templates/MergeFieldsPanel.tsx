import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MergeField } from '@/hooks/useDocumentTemplates';

interface MergeFieldsPanelProps {
  fields: MergeField[];
  onInsertField?: (fieldKey: string) => void;
}

export function MergeFieldsPanel({ fields, onInsertField }: MergeFieldsPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (fieldKey: string) => {
    navigator.clipboard.writeText(fieldKey);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
    
    if (onInsertField) {
      onInsertField(fieldKey);
    }
  };

  return (
    <div className="border rounded-lg bg-card">
      <div className="p-3 border-b">
        <h3 className="font-medium text-sm">Available Merge Fields</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Click to copy a field to your clipboard
        </p>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="p-3 space-y-1">
          {fields.map((field) => (
            <Tooltip key={field.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-auto py-2 px-3 text-left"
                  onClick={() => handleCopy(field.field_key)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                        {field.field_key}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {field.field_label}
                    </p>
                  </div>
                  {copiedField === field.field_key ? (
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[250px]">
                <p className="font-medium">{field.field_label}</p>
                {field.description && (
                  <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                )}
                {field.sample_value && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Example: {field.sample_value}
                  </Badge>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
