import { FormField } from '@/components/auth/form-field.tsx';
import { Button } from '@/components/ui/button.tsx';
import { toast } from '@/components/ui/use-toast';
import { resetPasswordSchema } from '@/components/util/form-schemas.ts';
import { calculatePasswordStrength } from '@/components/util/password-utils.ts';
import { UsersApiClient } from '@/lib/api/users.ts';
import { authenticationProviderInstance } from '@/lib/authentication-provider.ts';

import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

interface FormData {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPassword() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const usersApiClient = new UsersApiClient(authenticationProviderInstance);
      await usersApiClient.resetPassword(uid!, token!, data.newPassword);
      toast({
        title: 'Success',
        description: 'Password changed successfully.',
        action: <Check className="h-4 w-4 text-green-500" />,
      });
      navigate('/login');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const passwordStrength = calculatePasswordStrength(password);

  const passwordRequirements = [
    { text: 'At least 8 characters', met: password.length >= 8 },
    { text: 'At least one uppercase letter', met: /[A-Z]/.test(password) },
    { text: 'At least one lowercase letter', met: /[a-z]/.test(password) },
    { text: 'At least one number', met: /[0-9]/.test(password) },
    {
      text: 'At least one special character',
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <a href="https://ibb.co/SwRQqVwf">
            <img
              src="https://i.ibb.co/fd48mrdD/logo-no-background.png"
              alt="TripWhizz Logo"
            />
          </a>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600 text-sm mb-6">
            Please enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="relative">
            <FormField
              id="newPassword"
              label="New Password"
              type="password"
              register={register}
              error={errors.newPassword?.message}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="relative w-full h-2 bg-gray-200 rounded mt-1">
              <div
                className={`absolute h-full rounded ${
                  passwordStrength <= 2
                    ? 'bg-red-500'
                    : passwordStrength === 3
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${(passwordStrength / 5) * 100}%` }}
              />
            </div>
            <div className="mt-3 text-xs space-y-1.5">
              <p className="font-medium text-sm mb-1">Password requirements:</p>
              {passwordRequirements.map((req, index) => (
                <div key={index} className="flex items-center">
                  {req.met ? (
                    <Check className="h-3.5 w-3.5 text-green-500 mr-2" />
                  ) : (
                    <div className="h-3.5 w-3.5 border border-gray-300 rounded-full mr-2" />
                  )}
                  <span
                    className={
                      req.met
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-muted-foreground'
                    }
                  >
                    {req.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <FormField
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              register={register}
              error={errors.confirmPassword?.message}
            />
          </div>

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
