import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { openWhatsApp } from '@/lib/whatsapp';
import type { QueueWithDetails } from '@/types';

interface NotificationDialogProps {
  queue: QueueWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function NotificationDialog({
  queue,
  open,
  onOpenChange,
  onSuccess,
}: NotificationDialogProps) {
  const { toast } = useToast();
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>('10');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!queue) return;

    setLoading(true);
    try {
      const response = await api.queue.notify(queue.id, parseInt(estimatedMinutes), getMessagePreview());

      if (response.success && response.phoneNumber) {
        // Open WhatsApp with pre-filled message
        // Also copy to clipboard in case WhatsApp Web is already open
        await openWhatsApp(response.phoneNumber, response.message, {
          copyToClipboard: true,
          reuseTab: true
        });

        toast({
          title: 'Opening WhatsApp',
          description: 'Message copied to clipboard. If WhatsApp Web is already open, just paste the message!',
          duration: 5000,
        });

        onOpenChange(false);
        onSuccess?.();
      } else {
        throw new Error(response.message || 'Failed to get user details');
      }
    } catch (error: any) {
      toast({
        title: 'Failed to Open WhatsApp',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate WhatsApp message preview with compatible emojis
  const getMessagePreview = () => {
    if (!queue) return '';

    const salonName = queue.salon?.name || 'the salon';
    const customerName = queue.user?.name || 'Customer';
    const servicesList = queue.services?.map(s => s.name).join(', ') || 'your service';
    
    return `Hi ${customerName}! 😊

Your turn is coming up at ${salonName}!

✂️ Services: ${servicesList}
⏰ Please arrive in: ${estimatedMinutes} minutes

We're ready for you! See you soon! 💈

- ${salonName}
Powered by AltQ`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Send Notification
          </DialogTitle>
          <DialogDescription>
            Notify {queue?.user?.name || 'the customer'} that their turn is approaching
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4 overflow-y-auto flex-1">
          {/* Customer Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Customer Details</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="break-words">
                <strong>Name:</strong> {queue?.user?.name || 'Unknown'}
              </p>
              <p className="break-all">
                <strong>Phone:</strong> {queue?.user?.phone || 'Not provided'}
              </p>
              <p>
                <strong>Position:</strong> #{queue?.position || 0}
              </p>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Services</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {queue?.services?.map((service) => (
                <li key={service.id} className="break-words">
                  {service.name} ({service.duration} min - ${service.price})
                </li>
              ))}
            </ul>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Estimated Arrival Time</h4>
            <Select value={estimatedMinutes} onValueChange={setEstimatedMinutes}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="20">20 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">WhatsApp Message Preview</h4>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm whitespace-pre-wrap break-words overflow-x-auto">
              {getMessagePreview()}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 px-6 py-4 border-t bg-white">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Notification
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
