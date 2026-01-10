'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApi, type PerformWorkflowActionDto } from '@/lib/api/workflow';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface WorkflowActionsProps {
  documentType: string;
  documentId: string;
  currentState: string;
  onActionComplete?: () => void;
}

export function WorkflowActions({
  documentType,
  documentId,
  currentState,
  onActionComplete,
}: WorkflowActionsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: actions, isLoading } = useQuery({
    queryKey: ['workflow-actions', documentType, documentId, currentState],
    queryFn: () =>
      workflowApi.getAvailableActions(
        documentType,
        currentState,
        user?.roles
      ),
    enabled: !!documentType && !!documentId && !!currentState,
  });

  const performAction = useMutation({
    mutationFn: (action: string) =>
      workflowApi.performAction({
        documentType,
        documentId,
        action,
        userId: user?.id,
        userRoles: user?.roles,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [documentType.toLowerCase().replace(/\s+/g, '-'), documentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['workflow-actions', documentType, documentId],
      });
      toast.success('Action performed successfully');
      onActionComplete?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to perform action');
    },
  });

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading actions...</div>;
  }

  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          onClick={() => performAction.mutate(action.name)}
          disabled={performAction.isPending}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

