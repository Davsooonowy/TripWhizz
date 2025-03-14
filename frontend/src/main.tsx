import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from '@/pages/login.tsx';
import NotFound from './pages/not-found';
import App from '@/App.tsx';
import Layout from '@/components/layout/layout.tsx';
import NoTripsPage from '@/pages/no-trips/index.tsx';
import OnboardingPage from '@/pages/onboarding/index.tsx';
import { DarkModeProvider } from '@/components/util/dark-mode-provider.tsx';

// temporary loader to redirect to login page
const protectedLoginLoader = async () => {
  // in future if .... then redirect ("/login")
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
        path: '/no-trips',
        element: <NoTripsPage />,
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
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DarkModeProvider>
      <RouterProvider router={router} />
    </DarkModeProvider>
  </StrictMode>,
);
