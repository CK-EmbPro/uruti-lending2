'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  useCreateTask,
  useUpdateTask,
  useAssignTask,
  useBulkAssignTasks,
  useAddTaskComment,
  useEscalateTask,
  useTasks,
} from '@/lib/hooks/useWorkflowException';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  Edit,
  UserPlus,
  MessageSquare,
  ArrowUp,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  TaskStatus,
  TaskPriority,
  TaskType,
  type Task,
  type CreateTaskDto,
  type UpdateTaskDto,
  type AssignTaskDto,
  type BulkAssignTasksDto,
  type AddTaskCommentDto,
  type EscalateTaskDto,
} from '@/lib/api/workflow-exception';

export function TaskManagementDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | ''>('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>(TaskType.OTHER);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [slaHours, setSlaHours] = useState('');
  const [comment, setComment] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [escalatedTo, setEscalatedTo] = useState('');

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const assignTask = useAssignTask();
  const bulkAssignTasks = useBulkAssignTasks();
  const addTaskComment = useAddTaskComment();
  const escalateTask = useEscalateTask();
  const { data: tasks, isLoading, refetch } = useTasks({
    status: selectedStatus || undefined,
    priority: selectedPriority || undefined,
  });

  const tasksArray = Array.isArray(tasks) ? tasks : [];

  const handleCreateTask = () => {
    const dto: CreateTaskDto = {
      title,
      description: description || undefined,
      taskType,
      priority,
      assignedTo: assignedTo || undefined,
      dueDate: dueDate || undefined,
      slaHours: slaHours ? parseInt(slaHours) : undefined,
    };

    createTask.mutate(dto, {
      onSuccess: () => {
        setShowCreateModal(false);
        resetForm();
      },
    });
  };

  const handleAssignTask = () => {
    if (!selectedTask) return;

    const dto: AssignTaskDto = {
      assignedTo,
    };

    assignTask.mutate(
      { id: selectedTask.id, dto },
      {
        onSuccess: () => {
          setShowAssignModal(false);
          setSelectedTask(null);
          resetForm();
        },
      },
    );
  };

  const handleBulkAssign = () => {
    if (selectedTaskIds.length === 0) return;

    const dto: BulkAssignTasksDto = {
      taskIds: selectedTaskIds,
      assignedTo,
    };

    bulkAssignTasks.mutate(dto, {
      onSuccess: () => {
        setShowBulkAssignModal(false);
        setSelectedTaskIds([]);
        resetForm();
      },
    });
  };

  const handleAddComment = () => {
    if (!selectedTask) return;

    const dto: AddTaskCommentDto = {
      comment,
    };

    addTaskComment.mutate(
      { id: selectedTask.id, dto },
      {
        onSuccess: () => {
          setShowCommentModal(false);
          setSelectedTask(null);
          setComment('');
        },
      },
    );
  };

  const handleEscalate = () => {
    if (!selectedTask) return;

    const dto: EscalateTaskDto = {
      escalatedTo,
      escalationReason,
    };

    escalateTask.mutate(
      { id: selectedTask.id, dto },
      {
        onSuccess: () => {
          setShowEscalateModal(false);
          setSelectedTask(null);
          resetForm();
        },
      },
    );
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTaskType(TaskType.OTHER);
    setPriority(TaskPriority.MEDIUM);
    setAssignedTo('');
    setDueDate('');
    setSlaHours('');
    setComment('');
    setEscalationReason('');
    setEscalatedTo('');
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.ESCALATED:
        return 'bg-red-100 text-red-800';
      case TaskStatus.ON_HOLD:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.CRITICAL:
        return 'bg-red-100 text-red-800';
      case TaskPriority.URGENT:
        return 'bg-orange-100 text-orange-800';
      case TaskPriority.HIGH:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingCount = tasksArray.filter((t) => t.status === TaskStatus.PENDING).length;
  const inProgressCount = tasksArray.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
  const escalatedCount = tasksArray.filter((t) => t.isEscalated).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Task Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage tasks, assignments, and workflow exceptions</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as TaskStatus | '')}
            className="w-40"
          >
            <option value="">All Status</option>
            {Object.values(TaskStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <Select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as TaskPriority | '')}
            className="w-40"
          >
            <option value="">All Priority</option>
            {Object.values(TaskPriority).map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              if (selectedTaskIds.length > 0) {
                setShowBulkAssignModal(true);
              } else {
                toast.error('Please select tasks to assign');
              }
            }}
            disabled={selectedTaskIds.length === 0}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Bulk Assign ({selectedTaskIds.length})
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{inProgressCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Escalated</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{escalatedCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : tasksArray.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTaskIds(tasksArray.map((t) => t.id));
                          } else {
                            setSelectedTaskIds([]);
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasksArray.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.includes(task.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTaskIds([...selectedTaskIds, task.id]);
                            } else {
                              setSelectedTaskIds(selectedTaskIds.filter((id) => id !== task.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">{task.taskType}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{task.assignedByName || 'Unassigned'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTask(task);
                              setShowAssignModal(true);
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTask(task);
                              setShowCommentModal(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Comment
                          </Button>
                          {!task.isEscalated && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTask(task);
                                setShowEscalateModal(true);
                              }}
                            >
                              <ArrowUp className="h-4 w-4 mr-1" />
                              Escalate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tasks found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create Task"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Task Type *</label>
            <Select value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)}>
              {Object.values(TaskType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              {Object.values(TaskPriority).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign To (User ID)</label>
            <Input
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="User ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SLA Hours</label>
            <Input
              type="number"
              value={slaHours}
              onChange={(e) => setSlaHours(e.target.value)}
              placeholder="Hours"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={!title || createTask.isPending}>
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Task Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedTask(null);
          resetForm();
        }}
        title="Assign Task"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign To (User ID) *</label>
            <Input
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="User ID"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignTask} disabled={!assignedTo || assignTask.isPending}>
              {assignTask.isPending ? 'Assigning...' : 'Assign Task'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Assign Modal */}
      <Modal
        isOpen={showBulkAssignModal}
        onClose={() => {
          setShowBulkAssignModal(false);
          setSelectedTaskIds([]);
          resetForm();
        }}
        title={`Bulk Assign ${selectedTaskIds.length} Tasks`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign To (User ID) *</label>
            <Input
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="User ID"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowBulkAssignModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAssign} disabled={!assignedTo || bulkAssignTasks.isPending}>
              {bulkAssignTasks.isPending ? 'Assigning...' : 'Assign Tasks'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Comment Modal */}
      <Modal
        isOpen={showCommentModal}
        onClose={() => {
          setShowCommentModal(false);
          setSelectedTask(null);
          setComment('');
        }}
        title="Add Comment"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comment *</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter your comment"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCommentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddComment} disabled={!comment || addTaskComment.isPending}>
              {addTaskComment.isPending ? 'Adding...' : 'Add Comment'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Escalate Task Modal */}
      <Modal
        isOpen={showEscalateModal}
        onClose={() => {
          setShowEscalateModal(false);
          setSelectedTask(null);
          resetForm();
        }}
        title="Escalate Task"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Escalate To (User ID) *</label>
            <Input
              value={escalatedTo}
              onChange={(e) => setEscalatedTo(e.target.value)}
              placeholder="Supervisor/Manager User ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Escalation Reason *</label>
            <Textarea
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              placeholder="Reason for escalation"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEscalateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEscalate}
              disabled={!escalatedTo || !escalationReason || escalateTask.isPending}
            >
              {escalateTask.isPending ? 'Escalating...' : 'Escalate Task'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

