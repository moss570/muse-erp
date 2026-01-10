import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface NewTemplateCardProps {
  onClick: () => void;
}

export function NewTemplateCard({ onClick }: NewTemplateCardProps) {
  return (
    <Card 
      className="group relative overflow-hidden transition-all hover:shadow-md hover:border-primary cursor-pointer border-dashed"
      onClick={onClick}
    >
      <div className="aspect-[3/4] flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
        <Plus className="h-10 w-10 mb-2" />
        <span className="text-sm font-medium">New template</span>
      </div>
    </Card>
  );
}
