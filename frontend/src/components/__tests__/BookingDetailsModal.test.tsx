import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import BookingDetailsModal from '../BookingDetailsModal';
import { useToast } from '../../hooks/use-toast';

// Mock the toast hook
vi.mock('../../hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

// Mock the API
vi.mock('../../lib/api', () => ({
  api: {
    auth: {
      completeProfile: vi.fn(),
    },
  },
}));

const mockToast = vi.fn();
const mockOnComplete = vi.fn();
const mockOnCancel = vi.fn();

describe('BookingDetailsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue({ toast: mockToast });
  });

  it('renders modal when open', () => {
    render(
      <BookingDetailsModal
        isOpen={true}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        salonName="Test Salon"
      />
    );
    
    expect(screen.getByText('Complete Your Booking')).toBeInTheDocument();
    expect(screen.getByText(/Test Salon/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <BookingDetailsModal
        isOpen={false}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.queryByText('Complete Your Booking')).not.toBeInTheDocument();
  });

  it('validates required name field', async () => {
    render(
      <BookingDetailsModal
        isOpen={true}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );
    
    const completeButton = screen.getByText('Complete Booking');
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
    
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('validates email format when provided', async () => {
    render(
      <BookingDetailsModal
        isOpen={true}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );
    
    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('Enter your email (optional)');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const completeButton = screen.getByText('Complete Booking');
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    });
    
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const { api } = await import('../../lib/api');
    (api.auth.completeProfile as any).mockResolvedValue({ success: true });
    
    render(
      <BookingDetailsModal
        isOpen={true}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );
    
    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('Enter your email (optional)');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    
    const completeButton = screen.getByText('Complete Booking');
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Profile Updated!',
        description: 'Your booking details have been saved.',
      });
    });
    
    expect(mockOnComplete).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
    });
  });

  it('submits form with name only', async () => {
    const { api } = await import('../../lib/api');
    (api.auth.completeProfile as any).mockResolvedValue({ success: true });
    
    render(
      <BookingDetailsModal
        isOpen={true}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );
    
    const nameInput = screen.getByPlaceholderText('Enter your full name');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    
    const completeButton = screen.getByText('Complete Booking');
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith({
        name: 'John Doe',
        email: undefined,
      });
    });
  });

  it('handles API errors', async () => {
    const { api } = await import('../../lib/api');
    (api.auth.completeProfile as any).mockRejectedValue(new Error('Network error'));
    
    render(
      <BookingDetailsModal
        isOpen={true}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );
    
    const nameInput = screen.getByPlaceholderText('Enter your full name');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    
    const completeButton = screen.getByText('Complete Booking');
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Network error',
        variant: 'destructive',
      });
    });
    
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <BookingDetailsModal
        isOpen={true}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    const { api } = await import('../../lib/api');
    (api.auth.completeProfile as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    render(
      <BookingDetailsModal
        isOpen={true}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );
    
    const nameInput = screen.getByPlaceholderText('Enter your full name');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    
    const completeButton = screen.getByText('Complete Booking');
    fireEvent.click(completeButton);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(completeButton).toBeDisabled();
  });
});