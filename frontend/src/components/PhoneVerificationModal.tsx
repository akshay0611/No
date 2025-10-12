import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Phone, Check } from 'lucide-react';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (phone: string) => void;
}

export function PhoneVerificationModal({ isOpen, onClose, onVerified }: PhoneVerificationModalProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const { toast } = useToast();

  const countryCode = '+91';

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setPhone('');
      setOtp('');
      setStep('phone');
      setGeneratedOtp('');
    }
  }, [isOpen]);

  const handleSendOtp = async () => {
    if (!phone || phone.length !== 10) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = `${countryCode}${phone}`;
      const response = await api.auth.sendOTP(fullPhone);
      
      // For testing: show OTP in toast
      const otpValue = response.debug?.otp || response.otp || '123456';
      setGeneratedOtp(otpValue);
      toast({
        title: '🔐 OTP Sent (Testing Mode)',
        description: `Your OTP is: ${otpValue}`,
        duration: 10000,
      });

      setStep('otp');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a valid 6-digit OTP',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = `${countryCode}${phone}`;
      await api.auth.verifyOTP(fullPhone, otp);
      
      toast({
        title: 'Phone Verified!',
        description: 'Your phone number has been verified successfully',
      });

      onVerified(fullPhone);
      onClose();
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFillOtp = () => {
    if (generatedOtp) {
      setOtp(generatedOtp);
      toast({
        title: 'OTP Auto-filled',
        description: 'Click Verify to continue',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-teal-600" />
            Verify Phone Number
          </DialogTitle>
          <DialogDescription>
            {step === 'phone' 
              ? 'Please verify your phone number to join the queue'
              : 'Enter the OTP sent to your phone number'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === 'phone' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium">
                    {countryCode}
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                    className="flex-1"
                  />
                </div>
              </div>

              <Button
                onClick={handleSendOtp}
                disabled={isLoading || phone.length !== 10}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-sm text-gray-500">
                  Sent to {countryCode}{phone}
                </p>
              </div>

              {/* Testing Mode: Auto-fill button */}
              {generatedOtp && (
                <Button
                  onClick={handleAutoFillOtp}
                  variant="outline"
                  className="w-full border-teal-200 text-teal-700 hover:bg-teal-50"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Auto-fill OTP (Testing)
                </Button>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => setStep('phone')}
                  variant="outline"
                  className="flex-1"
                >
                  Change Number
                </Button>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>

              <Button
                onClick={handleSendOtp}
                variant="ghost"
                className="w-full text-sm text-teal-600 hover:text-teal-700"
                disabled={isLoading}
              >
                Resend OTP
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
