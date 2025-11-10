import { Button } from '@/components/ui/button';

import React from 'react';

import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

interface GoogleLoginButtonProps {
  setFormError: (error: string | null) => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  setFormError,
}) => {
  const login = useGoogleLogin({
    onError: (err) => {
      console.error('Google login onError:', err);
      setFormError('Google login failed. Please try again.');
    },
    onSuccess: async (tokenResponse) => {
      try {
        console.log('Google onSuccess tokenResponse:', {
          ...tokenResponse,
          access_token: tokenResponse?.access_token
            ? `${tokenResponse.access_token.slice(0, 6)}...${tokenResponse.access_token.slice(-4)}`
            : undefined,
        });
        console.log('Posting Google token to backend:', {
          url: import.meta.env.VITE_GOOGLE_AUTH_API,
          hasToken: Boolean(tokenResponse.access_token),
        });
        const res = await axios.post(
          import.meta.env.VITE_GOOGLE_AUTH_API as string,
          {
            token: tokenResponse.access_token,
          },
        );

        console.log('Backend Google auth response:', {
          status: res.status,
          data: res.data,
        });
        localStorage.setItem('token', res.data.token);
        window.location.href = '/';
      } catch (error: any) {
        console.error('Google login error (axios):', {
          isAxiosError: !!error?.isAxiosError,
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
          url: error?.config?.url,
          method: error?.config?.method,
        });
        setFormError('Google login failed. Please try again.');
      }
    },
  });

  return (
    <Button
      type="button"
      variant="outline"
      className="flex items-center"
      onClick={() => login()}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="h-4 w-4 mr-2"
      >
        <path
          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
          fill="currentColor"
        />
      </svg>
      Login with Google
    </Button>
  );
};

export default GoogleLoginButton;
