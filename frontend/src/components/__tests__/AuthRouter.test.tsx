import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AuthRouter from '../AuthRouter';
import { useAuth } from '../../context/AuthContext';

// Mock all the child components
vi.mock('../AuthLoadingScreen', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="auth-loading" onClick={onComplete}>Loading...</div>
  ),
}));

vi.mock('../PhoneAuth', () => ({
  default: ({ onOTPSent }: { onOTPSent: (phone: string) => void }) => (
    <div data-testid="phone-auth" onClick={() => onOTPSent('+919876543210')}>
      Phone Auth
    </div>
  ),
}));

vi.mock('../PhoneOTPVerification', () => ({
  default: ({ onVerificationSuccess }: { onVerificationSuccess: (user: any, token: string) => void }) => (
    <div 
      data-testid="otp-verification" 
      onClick={() => onVerificationSuccess({ id: '1', phone: '+919876543210' }, 'token')}
    >
      OTP Verification
    </div>
  ),
}));

vi.mock('../WelcomeLoading', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="welcome-loading" onClick={onComplete}>Welcome Loading</div>
  ),
}));

vi.mock('../MinimalUserDashboard', () => ({
  default: () => <div data-testid="user-dashboard">User Dashboard</div>,
}));

vi.mock('../AdminLoginFlow', () => ({
  default: ({ onAuthSuccess }: { onAuthSuccess: (user: any, token: string) => void }) => (
    <div 
      data-testid="admin-login" 
      onClick={() => onAuthSuccess({ id: '1', role: 'salon_owner' }, 'admin-token')}
    >
      Admin Login
    </div>
  ),
}));

// Mock the auth context
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockLogin = vi.fn();
const mockSetAuthFlow = vi.fn();
const mockUpdateUser = vi.fn();

describe('AuthRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: null,
      login: mockLogin,
      authFlow: 'customer',
      setAuthFlow: mockSetAuthFlow,
      needsProfileCompletion: () => false,
      updateUser: mockUpdateUser,
    });
  });

  it('shows loading screen initially', () => {
    render(<AuthRouter />);
    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
  });

  it('navigates to phone auth after loading for customer flow', async () => {
    render(<AuthRouter defaultFlow="customer" />);
    
    // Click loading screen to complete
    const loadingScreen = screen.getByTestId('auth-loading');
    loadingScreen.click();
    
    await waitFor(() => {
      expect(screen.getByTestId('phone-auth')).toBeInTheDocument();
    });
  });

  it('navigates to admin login for admin flow', async () => {
    (useAuth as any).mockReturnValue({
      user: null,
      login: mockLogin,
      authFlow: 'admin',
      setAuthFlow: mockSetAuthFlow,
      needsProfileCompletion: () => false,
      updateUser: mockUpdateUser,
    });
    
    render(<AuthRouter defaultFlow="admin" />);
    
    const loadingScreen = screen.getByTestId('auth-loading');
    loadingScreen.click();
    
    await waitFor(() => {
      expect(screen.getByTestId('admin-login')).toBeInTheDocument();
    });
  });

  it('shows dashboard for authenticated user', () => {
    (useAuth as any).mockReturnValue({
      user: { id: '1', phone: '+919876543210', name: 'Test User' },
      login: mockLogin,
      authFlow: 'customer',
      setAuthFlow: mockSetAuthFlow,
      needsProfileCompletion: () => false,
      updateUser: mockUpdateUser,
    });
    
    render(<AuthRouter />);
    expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
  });

  it('completes full customer authentication flow', async () => {
    render(<AuthRouter />);
    
    // Start with loading
    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
    
    // Complete loading
    screen.getByTestId('auth-loading').click();
    
    await waitFor(() => {
      expect(screen.getByTestId('phone-auth')).toBeInTheDocument();
    });
    
    // Complete phone auth
    screen.getByTestId('phone-auth').click();
    
    await waitFor(() => {
      expect(screen.getByTestId('otp-verification')).toBeInTheDocument();
    });
    
    // Complete OTP verification
    screen.getByTestId('otp-verification').click();
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        { id: '1', phone: '+919876543210' },
        'token'
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('welcome-loading')).toBeInTheDocument();
    });
  });

  it('handles admin authentication flow', async () => {
    (useAuth as any).mockReturnValue({
      user: null,
      login: mockLogin,
      authFlow: 'admin',
      setAuthFlow: mockSetAuthFlow,
      needsProfileCompletion: () => false,
      updateUser: mockUpdateUser,
    });
    
    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: '' };
    
    render(<AuthRouter defaultFlow="admin" />);
    
    // Complete loading
    screen.getByTestId('auth-loading').click();
    
    await waitFor(() => {
      expect(screen.getByTestId('admin-login')).toBeInTheDocument();
    });
    
    // Complete admin login
    screen.getByTestId('admin-login').click();
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        { id: '1', role: 'salon_owner' },
        'admin-token'
      );
    });
    
    // Should redirect to dashboard
    expect(window.location.href).toBe('/dashboard');
  });

  it('sets auth flow correctly', () => {
    render(<AuthRouter defaultFlow="customer" />);
    expect(mockSetAuthFlow).toHaveBeenCalledWith('customer');
  });
});