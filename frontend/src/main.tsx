import { AppLoader } from '@/components/ui/app-loader';
import { Toaster } from '@/components/ui/toaster';
import { DarkModeProvider } from '@/components/util/dark-mode-provider.tsx';
import { TripProvider } from '@/components/util/trip-context';
import { UsersApiClient } from '@/lib/api/users.ts';
import { authenticationProviderInstance } from '@/lib/authentication-provider.ts';

import React, { StrictMode, Suspense } from 'react';

import { createRoot } from 'react-dom/client';
import {
  RouterProvider,
  createBrowserRouter,
  redirect,
} from 'react-router-dom';

import './index.css';

const LoginPage = React.lazy(() => import('@/pages/login'));
const NotFound = React.lazy(() => import('./pages/not-found'));
const App = React.lazy(() => import('@/App.tsx'));
const Layout = React.lazy(() => import('@/components/layout/layout.tsx'));
const HomePage = React.lazy(() => import('@/pages/index'));
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
const StageDetailsPage = React.lazy(
  () => import('@/components/trip/stage-details.tsx'),
);
const PackingListPage = React.lazy(() => import('@/pages/packing'));
const PackingItemsPage = React.lazy(() => import('@/pages/packing/items'));
const SharedPackingPage = React.lazy(() => import('@/pages/packing/shared'));
const PackingTemplatesPage = React.lazy(
  () => import('@/pages/packing/templates'),
);
const DocumentsPage = React.lazy(() => import('@/pages/documents'));
const TripDocumentsPage = React.lazy(
  () => import('@/pages/trip/[id]/documents'),
);
const DocumentUploadPage = React.lazy(
  () => import('@/pages/trip/[id]/documents/upload'),
);
const ItineraryDaysPage = React.lazy(() => import('@/pages/itinerary/days'));
const TripItineraryDaysPage = React.lazy(
  () => import('@/pages/trip/[id]/itinerary/days'),
);
const ItineraryActivitiesPage = React.lazy(
  () => import('@/pages/itinerary/activities'),
);
const TripItineraryActivitiesPage = React.lazy(
  () => import('@/pages/trip/[id]/itinerary/activities'),
);
const TripExpensesOverviewPage = React.lazy(
  () => import('@/pages/trip/[id]/expenses/overview'),
);
const TripExpensesSplitPage = React.lazy(
  () => import('@/pages/trip/[id]/expenses/split'),
);
const TripExpensesAddPage = React.lazy(
  () => import('@/pages/trip/[id]/expenses/add'),
);
const TripMapsPage = React.lazy(
  () => import('@/pages/trip/[id]/itinerary/maps.tsx'),
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
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/trip',
        element: <StartTripPage />,
      },
      {
        path: '/trip/:tripId/stages/:stageId',
        element: <StageDetailsPage />,
      },
      {
        path: '/trip/:tripId/packing',
        element: <PackingListPage />,
      },
      {
        path: '/trip/:tripId/packing/items',
        element: <PackingItemsPage />,
      },
      {
        path: '/trip/:tripId/packing/shared',
        element: <SharedPackingPage />,
      },
      {
        path: '/trip/:tripId/packing/templates',
        element: <PackingTemplatesPage />,
      },
      {
        path: '/itinerary/days',
        element: <ItineraryDaysPage />,
      },
      {
        path: '/trip/:tripId/itinerary/days',
        element: <TripItineraryDaysPage />,
      },
      {
        path: '/itinerary/activities',
        element: <ItineraryActivitiesPage />,
      },
      {
        path: '/trip/:tripId/itinerary/activities',
        element: <TripItineraryActivitiesPage />,
      },
      {
        path: '/documents',
        element: <DocumentsPage />,
      },
      {
        path: '/trip/:tripId/documents',
        element: <TripDocumentsPage />,
      },
      {
        path: '/trip/:tripId/documents/upload',
        element: <DocumentUploadPage />,
      },
      { path: '/trip/:tripId/expenses', element: <TripExpensesOverviewPage /> },
      {
        path: '/trip/:tripId/expenses/overview',
        element: <TripExpensesOverviewPage />,
      },
      {
        path: '/trip/:tripId/expenses/split',
        element: <TripExpensesSplitPage />,
      },
      { path: '/trip/:tripId/expenses/add', element: <TripExpensesAddPage /> },
      { path: '/trip/:tripId/maps', element: <TripMapsPage /> },
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
      <TripProvider>
        <Suspense fallback={<AppLoader />}>
          <RouterProvider router={router} />
        </Suspense>
        <Toaster />
      </TripProvider>
    </DarkModeProvider>
  </StrictMode>,
);
