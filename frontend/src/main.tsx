import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from 'react-router-dom';
import LoginPage from '@/pages/login';
import NotFound from './pages/not-found';
import App from '@/App.tsx';
import Layout from '@/components/layout/layout.tsx';
import StartTripPage from '@/pages/trip/index.tsx';
import OnboardingPage from '@/pages/onboarding/index.tsx';
import { DarkModeProvider } from '@/components/util/dark-mode-provider.tsx';
import { authenticationProviderInstance } from '@/lib/authentication-provider.ts';
import ResetPassword from '@/pages/login/reset-password.tsx';
import { UsersApiClient } from '@/lib/api/users.ts';
import NotificationsPage from '@/pages/notifications';
import SettingsPage from '@/pages/settings';
import FriendsPage from '@/pages/friends';
import ProfileSettingsPage from '@/pages/settings/profile';
import { Toaster } from '@/components/ui/toaster';

const protectedLoginLoader = async () => {
  if (!authenticationProviderInstance.isAuthenticated()) {
    throw redirect('/login');
  }

  const usersApiClient = new UsersApiClient(authenticationProviderInstance);
  const user = await usersApiClient.getActiveUser();
  if (!user.onboarding_complete) {
    throw redirect('/onboarding');
  }

  return null;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <App />
      </Layout>
    ),
    loader: protectedLoginLoader,
    children: [
      {
        path: '/trip',
        element: <StartTripPage />,
      },
      {
        path: '/notifications',
        element: <NotificationsPage />,
      },
      {
        path: '/friends',
        element: <FriendsPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
      {
        path: '/settings/profile',
        element: <ProfileSettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  {
    path: '/reset-password/:uid/:token',
    element: <ResetPassword />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DarkModeProvider>
      <RouterProvider router={router} />
      <Toaster />
    </DarkModeProvider>
  </StrictMode>,
);
