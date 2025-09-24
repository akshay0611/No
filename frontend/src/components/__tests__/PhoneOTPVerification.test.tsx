import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PhoneOTPVerification from '../PhoneOTPVerification';
import { useToast } from '../../hooks/use-toast';

// Mock the toast hook
vi.mock('../../hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

// Mock the API
vi.mock('../../lib/api', () => ({
  api: {
    auth: {
      verifyOTP: vi.fn(),
      sendOTP: vi.fn(),
    },
  },
}));

const mockToast = vi.fn();
const mockOnVerificationSuccess = vi.fn();
const mockOnBack = vi.fn();

describe('PhoneOTPVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue({ toast: mockToast });
  });

  it('renders OTP verification form', () => {
    render(
      <PhoneOTPVerification
        phoneNumber="+919876543210"
        onVerificationSuccess={mockOnVerificationSuccess}
        onBack={mockOnBack}
      />
    );
    
    expect(screen.getByText('Verify Phone Number')).toBeInTheDocument();
    expect(screen.getByText('We sent a 6-digit code to')).toBeInTheDocument();
    expect(screen.getByText('+91***43210')).toBeInTheDocument();
  });

  it('masks phone number correctly', () => {
    render(
      <PhoneOTPVerification
        phoneNumber="+919876543210"
        onVerificationSuccess={mockOnVerificationSuccess}
        onBack={mockOnBack}
      />
    );
    
    expect(screen.getByText('+91***43210')).toBeInTheDocument();
  });

  it('validates OTP length', async () => {
    render(
      <PhoneOTPVerification
        phoneNumber="+919876543210"
        onVerificationSuccess={mockOnVerificationSuccess}
        onBack={mockOnBack}
      />
    );
    
    const verifyButton = screen.getByText('Verify & Continue');
    fireEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter the complete 6-digit code')).toBeInTheDocument();
    });
  });

  it('verifies OTP successfully', async () => {
    const { api } = await import('../../lib/api');
    const mockUser = { id: '1', phone: '+919876543210', name: null };
    const mockToken = 'mock-token';
    
    (api.auth.verifyOTP as any).mockResolvedValue({
      user: mockUser,
      token: mockToken,
    });
    
    render(
      <PhoneOTPVerification
        phoneNumber="+919876543210"
        onVerificationSuccess={mockOnVerificationSuccess}
        onBack={mockOnBack}
      />
    );
    
    // Simulate OTP input (6 digits)
    const otpInput = screen.getByRole('textbox');
    fireEvent.change(otpInput, { target: { value: '123456' } });
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Phone Verified!',
        description: 'Welcome to SmartQ!',
      });
    });
    
    expect(mockOnVerificationSuccess).toHaveBeenCalledWith(mockUser, mockToken);
  });

  it('handles invalid OTP', async () => {
    const { api } = await import('../../lib/api');
    (api.auth.verifyOTP as any).mockRejectedValue(new Error('Invalid OTP'));
    
    render(
      <PhoneOTPVerification
        phoneNumber="+919876543210"
        onVerificationSuccess={mockOnVerificationSuccess}
        onBack={mockOnBack}
      />
    );
    
    const otpInput = screen.getByRole('textbox');
    fireEvent.change(otpInput, { target: { value: '123456' } });
    
    await waitFor(() => {
      expect(screen.getByText('Invalid OTP. Please try again.')).toBeInTheDocument();
    });
    
    expect(mockOnVerificationSuccess).not.toHaveBeenCalled();
  });

  it('shows resend countdown', async () => {
    render(
      <PhoneOTPVerification
        phoneNumber="+919876543210"
        onVerificationSuccess={mockOnVerificationSuccess}
        onBack={mockOnBack}
      />
    );
    
    expect(screen.getByText(/Resend code in \d+s/)).toBeInTheDocument();
  });

  it('allows resend after countdown', async () => {
    const { api } = await import('../../lib/api');
    (api.auth.sendOTP as any).mockResolvedValue({ success: true });
    
    render(
      <PhoneOTPVerification
        phoneNumber="+919876543210"
        onVerificationSuccess={mockOnVerificationSuccess}
        onBack={mockOnBack}
      />
    );
    
    // Fast-forward time to enable resend
    vi.useFakeTimers();
    vi.advanceTimersByTime(30000);
    
    await waitFor(() => {
      expect(screen.getByText('Resend Code')).toBeInTheDocument();
    });
    
    const resendButton = screen.getByText('Resend Code');
    fireEvent.click(resendButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'OTP Resent!',
        description: expect.stringContaining('New verification code sent'),
      });
    });
    
    vi.useRealTimers();
  });

  it('limits failed attempts', async () => {
    const { api } = await import('../../lib/api');
    (api.auth.verifyOTP as any).mockRejectedValue(new Error('Invalid OTP'));
    
    render(
      <PhoneOTPVerification
        phoneNumber="+919876543210"
        onVerificationSuccess={mockOnVerificationSuccess}
        onBack={mockOnBack}
      />
    );
    
    const otpInput = screen.getByRole('textbox');
    
    // First failed attempt
    fireEvent.change(otpInput, { target: { value: '123456' } });
    await waitFor(() => {
      expect(screen.getByText('Invalid OTP. Please try again.')).toBeInTheDocument();
    });
    
    // Second failed attempt
    fireEvent.change(otpInput, { target: { value: '654321' } });
    await waitFor(() => {
      expect(screen.getByText('Invalid OTP. Please try again.')).toBeInTheDocument();
    });
    
    // Third failed attempt should show different message
    fireEvent.change(otpInput, { target: { value: '111111' } });
    await waitFor(() => {
      expect(screen.getByText('Too many failed attempts. Please request a new code.')).toBeInTheDocument();
    });
  });
});