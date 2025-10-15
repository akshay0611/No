import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  MessageCircle,
  Phone,
  PlayCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { QueueWithDetails } from '@/types';
import NotificationDialog from './NotificationDialog';

interface QueueActionButtonsProps {
  queue: QueueWithDetails;
  onActionComplete?: () => void;
}

export default function QueueActionButtons({
  queue,
  onActionComplete,
}: QueueActionButtonsProps) {
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showNoShowDialog, setShowNoShowDialog] = useState(false);
  const [showStartServiceDialog, setShowStartServiceDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);

  // Determine which buttons should be enabled based on queue status
  const canNotify = queue.status === 'waiting';
  const canCall = ['waiting', 'notified', 'pending_verification', 'nearby'].includes(queue.status);
  const canStartService = queue.status === 'nearby';
  const canComplete = queue.status === 'in-progress';
  const canMarkNoShow = ['notified', 'pending_verification', 'nearby', 'in-progress'].includes(queue.status);

  const handleCall = async () => {
    setLoadingAction('call');
    try {
      const response = await api.queue.call(queue.id);
      
      if (response.success && response.phoneNumber) {
        // Open direct phone call
        window.location.href = `tel:${response.phoneNumber}`;
        
        toast({
          title: 'Opening Phone',
          description: `Calling ${response.userName || 'customer'} at ${response.phoneNumber}`,
        });
      } else {
        throw new Error(response.message || 'Failed to get phone number');
      }
    } catch (error: any) {
      toast({
        title: 'Call Failed',
        description: error.message || 'Failed to get phone number',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStartService = async () => {
    setLoadingAction('start');
    try {
      await api.queue.updateStatus(queue.id, 'in-progress');
      
      toast({
        title: 'Service Started',
        description: `Service started for ${queue.user?.name || 'customer'}`,
      });
      
      setShowStartServiceDialog(false);
      onActionComplete?.();
    } catch (error: any) {
      toast({
        title: 'Failed to Start Service',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleComplete = async () => {
    setLoadingAction('complete');
    try {
      await api.queue.updateStatus(queue.id, 'completed');
      
      toast({
        title: 'Service Completed',
        description: `Service completed for ${queue.user?.name || 'customer'}`,
      });
      
      setShowCompleteDialog(false);
      onActionComplete?.();
    } catch (error: any) {
      toast({
        title: 'Failed to Complete Service',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleNoShow = async () => {
    setLoadingAction('no-show');
    try {
      await api.queue.updateStatus(queue.id, 'no-show', 'Marked as no-show by admin');
      
      toast({
        title: 'Marked as No-Show',
        description: `${queue.user?.name || 'Customer'} has been marked as no-show`,
      });
      
      setShowNoShowDialog(false);
      onActionComplete?.();
    } catch (error: any) {
      toast({
        title: 'Failed to Mark No-Show',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Calculate total service duration
  const totalDuration = queue.services?.reduce((sum, service) => sum + (service.duration || 0), 0) || 0;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Message Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowNotificationDialog(true)}
          disabled={!canNotify || loadingAction !== null}
          className="flex-1 min-w-[100px]"
        >
          <MessageCircle className="w-4 h-4" />
          Message
        </Button>

        {/* Call Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleCall}
          disabled={!canCall || loadingAction !== null}
          className="flex-1 min-w-[100px]"
        >
          {loadingAction === 'call' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Phone className="w-4 h-4" />
          )}
          Call
        </Button>

        {/* Start Service Button */}
        <Button
          size="sm"
          variant="default"
          onClick={() => setShowStartServiceDialog(true)}
          disabled={!canStartService || loadingAction !== null}
          className="flex-1 min-w-[120px] bg-teal-600 hover:bg-teal-700"
        >
          <PlayCircle className="w-4 h-4" />
          Start Service
        </Button>

        {/* Complete Button */}
        <Button
          size="sm"
          variant="default"
          onClick={() => setShowCompleteDialog(true)}
          disabled={!canComplete || loadingAction !== null}
          className="flex-1 min-w-[100px] bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4" />
          Complete
        </Button>

        {/* Mark as No-Show Button */}
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setShowNoShowDialog(true)}
          disabled={!canMarkNoShow || loadingAction !== null}
          className="flex-1 min-w-[120px]"
        >
          <XCircle className="w-4 h-4" />
          No-Show
        </Button>
      </div>

      {/* Start Service Confirmation Dialog */}
      <AlertDialog open={showStartServiceDialog} onOpenChange={setShowStartServiceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Service?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 mt-2">
                <p>
                  <strong>Customer:</strong> {queue.user?.name || 'Unknown'}
                </p>
                <p>
                  <strong>Services:</strong>
                </p>
                <ul className="list-disc list-inside ml-2">
                  {queue.services?.map((service) => (
                    <li key={service.id}>
                      {service.name} ({service.duration} min)
                    </li>
                  ))}
                </ul>
                <p>
                  <strong>Estimated Time:</strong> {totalDuration} minutes
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingAction === 'start'}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStartService}
              disabled={loadingAction === 'start'}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {loadingAction === 'start' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Starting...
                </>
              ) : (
                'Start Service'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Service Confirmation Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Service?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 mt-2">
                <p>
                  Mark service as completed for <strong>{queue.user?.name || 'this customer'}</strong>?
                </p>
                <p className="text-sm text-gray-600">
                  This will update queue positions and notify the next customer.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingAction === 'complete'}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleComplete}
              disabled={loadingAction === 'complete'}
              className="bg-green-600 hover:bg-green-700"
            >
              {loadingAction === 'complete' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Completing...
                </>
              ) : (
                'Complete Service'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No-Show Confirmation Dialog */}
      <AlertDialog open={showNoShowDialog} onOpenChange={setShowNoShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as No-Show?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 mt-2">
                <p>
                  Mark <strong>{queue.user?.name || 'this customer'}</strong> as no-show?
                </p>
                <p className="text-sm text-gray-600">
                  This will remove them from the queue and update their reputation score.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingAction === 'no-show'}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleNoShow}
              disabled={loadingAction === 'no-show'}
              className="bg-red-600 hover:bg-red-700"
            >
              {loadingAction === 'no-show' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Marking...
                </>
              ) : (
                'Mark as No-Show'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notification Dialog */}
      <NotificationDialog
        queue={queue}
        open={showNotificationDialog}
        onOpenChange={setShowNotificationDialog}
        onSuccess={onActionComplete}
      />
    </>
  );
}
