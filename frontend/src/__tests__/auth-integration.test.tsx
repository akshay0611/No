import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import AuthRouter from '../components/AuthRouter';

// Mock the API
vi.mock('../lib/api', () => ({
  api: {
    auth: {
      sendOTP: vi.fn(),
      verifyOTP: vi.fn(),
      completeProfile: vi.fn(),
      getProfile: vi.fn(),
    },
  },
}));

// Mock toast
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Create a test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('completes full customer authentication flow', async () => {
    const { api } = await import('../lib/api');
    
    // Mock API responses
    (api.auth.sendOTP as any).mockResolvedValue({ success: true, isNewUser: true });
    (api.auth.verifyOTP as any).mockResolvedValue({
      user: { id: '1', phone: '+919876543210', name: null, role: 'customer' },
      token: 'test-token',
    });
    
    render(
      <TestWrapper>
        <AuthRouter />
      </TestWrapper>
    );

    // Should start with loading screen
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for phone auth screen
    await waitFor(() => {
      expect(screen.getByText('Log in or sign up')).toBeInTheDocument();
    });

    // Enter phone number
    const phoneInput = screen.getByPlaceholderText('Enter phone number');
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    // Click continue
    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    // Should move to OTP verification
    await waitFor(() => {
      expect(screen.getByText('Verify Phone Number')).toBeInTheDocument();
    });

    // Enter OTP
    const otpInputs = screen.getAllByRole('textbox');
    const otpInput = otpInputs.find(input => input.getAttribute('maxlength') === '6');
    if (otpInput) {
      fireEvent.change(otpInput, { target: { value: '123456' } });
    }

    // Should complete verification and show welcome screen
    await waitFor(() => {
      expect(screen.getByText('Welcome!')).toBeInTheDocument();
    });

    // Should eventually show dashboard
    await waitFor(() => {
      expect(screen.getByText('Hi! 👋')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify API calls were made
    expect(api.auth.sendOTP).toHaveBeenCalledWith('+919876543210');
    expect(api.auth.verifyOTP).toHaveBeenCalledWith('+919876543210', '123456');
  });

  it('handles progressive profile completion', async () => {
    const { api } = await import('../lib/api');
    
    // Mock user without name (needs profile completion)
    const incompleteUser = { 
      id: '1', 
      phone: '+919876543210', 
      name: null, 
      role: 'customer' 
    };

    (api.auth.completeProfile as any).mockResolvedValue({
      user: { ...incompleteUser, name: 'John Doe' },
    });

    // Start with authenticated but incomplete user
    localStorage.setItem('smartq_token', 'test-token');
    localStorage.setItem('smartq_user', JSON.stringify(incompleteUser));

    render(
      <TestWrapper>
        <AuthRouter />
      </TestWrapper>
    );

    // Should show dashboard
    await waitFor(() => {
      expect(screen.getByText('Hi! 👋')).toBeInTheDocument();
    });

    // Try to book a salon (should trigger profile completion)
    const joinQueueButton = screen.getAllByText('Join Queue')[0];
    fireEvent.click(joinQueueButton);

    // Should show booking details modal
    await waitFor(() => {
      expect(screen.getByText('Complete Your Booking')).toBeInTheDocument();
    });

    // Fill in profile details
    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('Enter your email (optional)');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    // Complete booking
    const completeButton = screen.getByText('Complete Booking');
    fireEvent.click(completeButton);

    // Should call profile completion API
    await waitFor(() => {
      expect(api.auth.completeProfile).toHaveBeenCalledWith('John Doe', 'john@example.com');
    });
  });

  it('handles admin authentication flow', async () => {
    const { api } = await import('../lib/api');
    
    // Mock admin login (using existing login endpoint)
    (api.auth.login as any) = vi.fn().mockResolvedValue({
      user: { id: '1', email: 'admin@smartq.com', role: 'salon_owner' },
      token: 'admin-token',
    });

    // Mock window.location.href for admin redirect
    delete (window as any).location;
    (window as any).location = { href: '' };

    render(
      <TestWrapper>
        <AuthRouter defaultFlow="admin" />
      </TestWrapper>
    );

    // Should show admin login
    await waitFor(() => {
      expect(screen.getByText('Admin Login')).toBeInTheDocument();
    });

    // Enter admin credentials
    const emailInput = screen.getByPlaceholderText('Enter your admin email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    
    fireEvent.change(emailInput, { target: { value: 'admin@smartq.com' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });

    // Click sign in
    const signInButton = screen.getByText('Sign In to Dashboard');
    fireEvent.click(signInButton);

    // Should redirect to dashboard
    await waitFor(() => {
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('persists authentication state across page reloads', async () => {
    const user = { 
      id: '1', 
      phone: '+919876543210', 
      name: 'John Doe', 
      role: 'customer' 
    };
    const token = 'test-token';

    // Set up localStorage as if user was previously authenticated
    localStorage.setItem('smartq_token', token);
    localStorage.setItem('smartq_user', JSON.stringify(user));

    const { api } = await import('../lib/api');
    (api.auth.getProfile as any).mockResolvedValue(user);

    render(
      <TestWrapper>
        <AuthRouter />
      </TestWrapper>
    );

    // Should show dashboard immediately (no loading screens)
    await waitFor(() => {
      expect(screen.getByText('Hi John! 👋')).toBeInTheDocument();
    });

    // Should verify token with server
    expect(api.auth.getProfile).toHaveBeenCalled();
  });

  it('handles authentication errors gracefully', async () => {
    const { api } = await import('../lib/api');
    
    // Mock API error
    (api.auth.sendOTP as any).mockRejectedValue(new Error('Network error'));

    render(
      <TestWrapper>
        <AuthRouter />
      </TestWrapper>
    );

    // Wait for phone auth screen
    await waitFor(() => {
      expect(screen.getByText('Log in or sign up')).toBeInTheDocument();
    });

    // Enter phone number and try to continue
    const phoneInput = screen.getByPlaceholderText('Enter phone number');
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Should remain on phone auth screen
    expect(screen.getByText('Log in or sign up')).toBeInTheDocument();
  });
});