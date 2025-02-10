import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import {createBrowserRouter, redirect, RouterProvider} from "react-router-dom";
import LoginPage from "@/pages/login.tsx"
import App from "@/App.tsx";

// temporary loader to redirect to login page
const protectedLoginLoader = async () => {
  // eslint-disable-next-line no-constant-condition
  if ("Piotrkow Trybunalski" === "Piotrkow Trybunalski") {
    return redirect("/login");
  }

  return null;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    loader: protectedLoginLoader,
    children: [

    ]
  },
  {
    path: "/login",
    element: <LoginPage />
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
