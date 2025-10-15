import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, AlertTriangle, MapPin, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface PendingVerification {
  queueId: string;
  userName: string;
  userPhone: string;
  distance?: number;
  checkInTime: Date;
  reason: 'no_location' | 'too_far' | 'suspicious';
}

interface ArrivalVerificationPanelProps {
  salonId: string;
  onVerificationComplete?: () => void;
}

export default function ArrivalVerificationPanel({
  salonId,
  onVerificationComplete,
}: ArrivalVerificationPanelProps) {
  const { toast } = useToast();
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingQueue, setProcessingQueue] = useState<string | null>(null);

  const fetchPendingVerifications = async () => {
    try {
      const data = await api.queue.getPendingVerifications(salonId);
      setPendingVerifications(data);
    } catch (error: any) {
      console.error('Failed to fetch pending verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVerifications();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchPendingVerifications();
    }, 10000);

    return () => clearInterval(interval);
  }, [salonId]);

  const handleVerify = async (queueId: string, confirmed: boolean) => {
    setProcessingQueue(queueId);
    try {
      await api.queue.verifyArrival(queueId, confirmed);

      toast({
        title: confirmed ? 'Arrival Confirmed' : 'Arrival Rejected',
        description: confirmed
          ? 'Customer has been verified and is ready for service'
          : 'Customer check-in has been rejected',
      });

      // Refresh the list
      await fetchPendingVerifications();
      onVerificationComplete?.();
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Failed to process verification',
        variant: 'destructive',
      });
    } finally {
      setProcessingQueue(null);
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'suspicious':
        return 'bg-red-50 border-red-200';
      case 'too_far':
        return 'bg-yellow-50 border-yellow-200';
      case 'no_location':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'suspicious':
        return 'Suspicious Pattern Detected';
      case 'too_far':
        return 'Too Far from Salon';
      case 'no_location':
        return 'No Location Provided';
      default:
        return 'Manual Verification Required';
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'suspicious':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'too_far':
        return <MapPin className="w-4 h-4 text-yellow-600" />;
      case 'no_location':
        return <MapPin className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Arrival Verifications</CardTitle>
          <CardDescription>Customers waiting for arrival confirmation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingVerifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Arrival Verifications</CardTitle>
          <CardDescription>Customers waiting for arrival confirmation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600">No pending verifications</p>
            <p className="text-sm text-gray-500 mt-1">
              All arrivals have been verified
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Pending Arrival Verifications</span>
          <span className="text-sm font-normal text-gray-500">
            {pendingVerifications.length} pending
          </span>
        </CardTitle>
        <CardDescription>Review and confirm customer arrivals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingVerifications.map((verification) => (
            <div
              key={verification.queueId}
              className={`p-4 rounded-lg border-2 ${getReasonColor(verification.reason)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Customer Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {verification.userName}
                    </h4>
                    {getReasonIcon(verification.reason)}
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">Phone:</span> {verification.userPhone}
                    </p>

                    {verification.distance !== undefined && (
                      <p className="text-gray-600">
                        <span className="font-medium">Distance:</span>{' '}
                        {verification.distance.toFixed(0)}m from salon
                      </p>
                    )}

                    <p className="text-gray-600">
                      <span className="font-medium">Check-in:</span>{' '}
                      {formatDistanceToNow(new Date(verification.checkInTime), {
                        addSuffix: true,
                      })}
                    </p>

                    <div className="flex items-center gap-1 mt-2">
                      {getReasonIcon(verification.reason)}
                      <span className="text-xs font-medium">
                        {getReasonText(verification.reason)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleVerify(verification.queueId, true)}
                    disabled={processingQueue === verification.queueId}
                    className="bg-green-600 hover:bg-green-700 min-w-[90px]"
                  >
                    {processingQueue === verification.queueId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Confirm
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVerify(verification.queueId, false)}
                    disabled={processingQueue === verification.queueId}
                    className="border-red-300 text-red-600 hover:bg-red-50 min-w-[90px]"
                  >
                    {processingQueue === verification.queueId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
