import { useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { UsersApiClient } from '@/lib/api/users.ts';
import { authenticationProviderInstance } from '@/lib/authentication-provider.ts';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const usersApiClient = new UsersApiClient(authenticationProviderInstance);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const user = await usersApiClient.getCurrentUser();
        if (!user.onboarding_complete) {
          navigate('/onboarding');
        }
      } catch {
        navigate('/login');
      }
    };

    checkOnboarding();
  }, [navigate, usersApiClient, authenticationProviderInstance]);

  return <>{children}</>;
};

export default ProtectedRoute;