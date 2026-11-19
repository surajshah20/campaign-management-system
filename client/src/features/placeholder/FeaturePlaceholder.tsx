import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { LucideIcon } from 'lucide-react';

interface FeaturePlaceholderProps {
  title: string;
  moduleName: string;
  targetPhase: string;
  description: string;
  icon: LucideIcon;
}

export const FeaturePlaceholder: React.FC<FeaturePlaceholderProps> = ({
  title,
  moduleName,
  targetPhase,
  description,
  icon: Icon,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              {title}
            </h1>
            <Badge variant="outline" size="sm">
              {moduleName}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Scheduled for implementation in <span className="font-semibold">{targetPhase}</span>
          </p>
        </div>
      </div>

      <Card className="p-8 bg-white border border-border shadow-subtle">
        <EmptyState
          icon={<Icon className="w-6 h-6 text-primary-600" />}
          title={`${title} Module Specification Ready`}
          description={description}
          actionLabel="View Development Roadmap"
          onAction={() =>
            alert(
              `This module is specified in the Master Guide and will be rolled out during ${targetPhase}. Foundation architecture, database tables, and tenant isolation models are already generated.`
            )
          }
        />
      </Card>
    </div>
  );
};
