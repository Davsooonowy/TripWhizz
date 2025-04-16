import React, { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from 'react-router-dom';
import { DarkModeProvider } from '@/components/util/dark-mode-provider.tsx';
import { authenticationProviderInstance } from '@/lib/authentication-provider.ts';
import { UsersApiClient } from '@/lib/api/users.ts';
import { Toaster } from '@/components/ui/toaster';

const LoginPage = React.lazy(() => import('@/pages/login'));
const NotFound = React.lazy(() => import('./pages/not-found'));
const App = React.lazy(() => import('@/App.tsx'));
const Layout = React.lazy(() => import('@/components/layout/layout.tsx'));
const StartTripPage = React.lazy(() => import('@/pages/trip/index.tsx'));
const OnboardingPage = React.lazy(() => import('@/pages/onboarding/index.tsx'));
const ResetPassword = React.lazy(
  () => import('@/pages/login/reset-password.tsx'),
);
const NotificationsPage = React.lazy(() => import('@/pages/notifications'));
const SettingsPage = React.lazy(() => import('@/pages/settings'));
const FriendsPage = React.lazy(() => import('@/pages/friends'));
const ProfileSettingsPage = React.lazy(
  () => import('@/pages/settings/profile'),
);
const TripTypePage = React.lazy(() => import('@/pages/trip/new'));
const PrivateTripPage = React.lazy(() => import('@/pages/trip/new/private'));
const PublicTripPage = React.lazy(() => import('@/pages/trip/new/public'));
const PrivateTripStagesPage = React.lazy(
  () => import('@/pages/trip/new/private/stages'),
);
const PublicTripStagesPage = React.lazy(
  () => import('@/pages/trip/new/public/stages'),
);
const PrivateTripInvitePage = React.lazy(
  () => import('@/pages/trip/new/private/invite'),
);
const PublicTripInvitePage = React.lazy(
  () => import('@/pages/trip/new/public/invite'),
);

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
        path: '/trip/new',
        element: <TripTypePage />,
      },
      {
        path: '/trip/new/private',
        element: <PrivateTripPage />,
      },
      {
        path: '/trip/new/public',
        element: <PublicTripPage />,
      },
      {
        path: '/trip/new/private/invite',
        element: <PrivateTripInvitePage />,
      },
      {
        path: '/trip/new/public/invite',
        element: <PublicTripInvitePage />,
      },
      {
        path: '/trip/new/private/stages',
        element: <PrivateTripStagesPage />,
      },
      {
        path: '/trip/new/public/stages',
        element: <PublicTripStagesPage />,
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
      <Suspense fallback={<div>Loading...</div>}>
        <RouterProvider router={router} />
      </Suspense>
      <Toaster />
    </DarkModeProvider>
  </StrictMode>,
);
