import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PhoneAuth from '../PhoneAuth';
import { useToast } from '../../hooks/use-toast';

// Mock the toast hook
vi.mock('../../hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

// Mock the API
vi.mock('../../lib/api', () => ({
  api: {
    auth: {
      sendOTP: vi.fn(),
    },
  },
}));

const mockToast = vi.fn();
const mockOnOTPSent = vi.fn();
const mockOnBack = vi.fn();

describe('PhoneAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue({ toast: mockToast });
  });

  it('renders phone authentication form', () => {
    render(<PhoneAuth onOTPSent={mockOnOTPSent} onBack={mockOnBack} />);
    
    expect(screen.getByText('Log in or sign up')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter phone number')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('validates phone number format', async () => {
    render(<PhoneAuth onOTPSent={mockOnOTPSent} onBack={mockOnBack} />);
    
    const phoneInput = screen.getByPlaceholderText('Enter phone number');
    const continueButton = screen.getByText('Continue');
    
    // Enter invalid phone number
    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.click(continueButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });
    
    expect(mockOnOTPSent).not.toHaveBeenCalled();
  });

  it('formats phone number correctly for Indian numbers', () => {
    render(<PhoneAuth onOTPSent={mockOnOTPSent} onBack={mockOnBack} />);
    
    const phoneInput = screen.getByPlaceholderText('Enter phone number');
    
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    
    expect(phoneInput).toHaveValue('98765 43210');
  });

  it('sends OTP successfully', async () => {
    const { api } = await import('../../lib/api');
    (api.auth.sendOTP as any).mockResolvedValue({ success: true });
    
    render(<PhoneAuth onOTPSent={mockOnOTPSent} onBack={mockOnBack} />);
    
    const phoneInput = screen.getByPlaceholderText('Enter phone number');
    const continueButton = screen.getByText('Continue');
    
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    fireEvent.click(continueButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'OTP Sent!',
        description: 'Verification code sent to +919876543210',
      });
    });
    
    expect(mockOnOTPSent).toHaveBeenCalledWith('+919876543210');
  });

  it('handles API errors gracefully', async () => {
    const { api } = await import('../../lib/api');
    (api.auth.sendOTP as any).mockRejectedValue(new Error('Network error'));
    
    render(<PhoneAuth onOTPSent={mockOnOTPSent} onBack={mockOnBack} />);
    
    const phoneInput = screen.getByPlaceholderText('Enter phone number');
    const continueButton = screen.getByText('Continue');
    
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    fireEvent.click(continueButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Network error',
        variant: 'destructive',
      });
    });
    
    expect(mockOnOTPSent).not.toHaveBeenCalled();
  });

  it('disables continue button when loading', async () => {
    const { api } = await import('../../lib/api');
    (api.auth.sendOTP as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    render(<PhoneAuth onOTPSent={mockOnOTPSent} onBack={mockOnBack} />);
    
    const phoneInput = screen.getByPlaceholderText('Enter phone number');
    const continueButton = screen.getByText('Continue');
    
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    fireEvent.click(continueButton);
    
    expect(screen.getByText('Sending OTP...')).toBeInTheDocument();
    expect(continueButton).toBeDisabled();
  });

  it('supports different country codes', () => {
    render(<PhoneAuth onOTPSent={mockOnOTPSent} onBack={mockOnBack} />);
    
    const countrySelect = screen.getByRole('combobox');
    fireEvent.click(countrySelect);
    
    expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    expect(screen.getByText('🇬🇧')).toBeInTheDocument();
  });
});