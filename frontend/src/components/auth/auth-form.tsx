import type React from 'react';
import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/auth/form-field.tsx';
import { SocialLoginButton } from '@/components/auth/social-login-button.tsx';
import { GalleryVerticalEnd, AlertCircle, Check } from 'lucide-react';
import {
  loginSchema,
  registerSchema,
  EmailSchema,
} from '@/components/util/form-schemas.ts';
import { calculatePasswordStrength } from '@/components/util/password-utils.ts';
import { UsersApiClient } from '@/lib/api/users.ts';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { authenticationProviderInstance } from '@/lib/authentication-provider.ts';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

interface AuthFormProps extends React.ComponentPropsWithoutRef<'form'> {
  isRegister?: boolean;
}

export function AuthForm({
  className,
  isRegister = false,
  ...props
}: AuthFormProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(isRegister);
  const [isResetPasswordMode, setIsResetPasswordMode] = useState(false);
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(10);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTime, setBlockTime] = useState<number | null>(null);
  const schema = isRegisterMode ? registerSchema : loginSchema;
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(isResetPasswordMode ? EmailSchema : schema),
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (blockTime) {
      const timer = setTimeout(() => {
        setIsBlocked(false);
        setLoginAttempts(6);
        setBlockTime(null);
      }, blockTime - Date.now());

      return () => clearTimeout(timer);
    }
  }, [blockTime]);

  const toggleFormMode = () => {
    setIsRegisterMode((prevMode) => !prevMode);
    setFormError(null);
    reset();
  };

  const toggleResetPasswordMode = () => {
    setIsResetPasswordMode((prevMode) => !prevMode);
    setFormError(null);
    reset();
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      const usersApiClient = new UsersApiClient(authenticationProviderInstance);
      await usersApiClient.sendPasswordResetEmail(email);
      alert('Password reset link sent successfully');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      setFormError('Error sending password reset email. Please try again.');
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setFormError(null);

    if (isResetPasswordMode) {
      await sendPasswordResetEmail(data.email);
      toggleResetPasswordMode();
      return;
    }

    if (isBlocked) {
      setFormError('Too many login attempts. Please try again later.');
      return;
    }

    try {
      const usersApiClient = new UsersApiClient(authenticationProviderInstance);
      let response;

      if (isRegisterMode) {
        response = await usersApiClient.createUser({
          email: data.email,
          password: data.password,
        });
      } else {
        response = await usersApiClient.loginUser({
          email: data.email,
          password: data.password,
        });
      }

      if (response.token) {
        authenticationProviderInstance.login(response.token);
        const user = await usersApiClient.getActiveUser();
        if (!user.onboarding_complete) {
          navigate('/onboarding');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      setLoginAttempts((prev) => prev - 1);
      if (loginAttempts <= 1) {
        setIsBlocked(true);
        setBlockTime(Date.now() + 60000);
      }
      setFormError(
        isRegisterMode
          ? 'Registration failed. Please check your information and try again.'
          : `Login failed. ${loginAttempts - 1} attempts left.`,
      );
    }
  };

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    if (provider === 'google') {
      window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    } else if (provider === 'facebook') {
      window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
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
    <form
      className={cn('flex flex-col gap-6', className)}
      {...props}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col items-center gap-2">
        <a href="#" className="flex flex-col items-center gap-2 font-medium">
          <div className="flex h-8 w-8 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-6" />
          </div>
          <span className="sr-only">Acme Inc.</span>
        </a>
        <h1 className="text-xl font-bold">Welcome to TripWhizz</h1>
        {!isResetPasswordMode && (
          <div className="text-center text-sm">
            {isRegisterMode ? (
              <>
                Already have an account?{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFormMode();
                  }}
                  className="underline underline-offset-4"
                >
                  Sign in
                </a>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFormMode();
                  }}
                  className="underline underline-offset-4"
                >
                  Sign up
                </a>
              </>
            )}
          </div>
        )}
      </div>

      {formError && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {isResetPasswordMode ? (
          <div className="grid gap-2">
            <FormField
              id="email"
              label="Email"
              type="email"
              register={register}
              error={errors.email?.message}
              placeholder="m@example.com"
            />
            <Button type="submit" className="w-full">
              Reset Password
            </Button>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                toggleResetPasswordMode();
              }}
              className="underline underline-offset-4 text-center"
            >
              Back to Login
            </a>
          </div>
        ) : (
          <>
            <FormField
              id="email"
              label="Email"
              type="email"
              register={register}
              error={errors.email?.message}
              placeholder="m@example.com"
            />
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                {!isRegisterMode && (
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleResetPasswordMode();
                    }}
                  >
                    Forgot your password?
                  </a>
                )}
              </div>
              <Input
                id="password"
                type="password"
                {...register('password')}
                aria-invalid={errors.password ? 'true' : 'false'}
                className={errors.password ? 'border-red-500' : ''}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}

              {isRegisterMode && (
                <>
                  <div className="relative w-full h-2 bg-gray-200 rounded mt-1">
                    <div
                      className={cn('absolute h-full rounded', {
                        'bg-red-500': passwordStrength <= 2,
                        'bg-yellow-500': passwordStrength === 3,
                        'bg-green-500': passwordStrength >= 4,
                      })}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>

                  <div className="mt-3 text-xs space-y-1.5">
                    <p className="font-medium text-sm mb-1">
                      Password requirements:
                    </p>
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
                </>
              )}
            </div>
            {isRegisterMode && (
              <FormField
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                register={register}
                error={errors.confirmPassword?.message}
              />
            )}
            <Button type="submit" className="w-full">
              {isRegisterMode ? 'Register' : 'Login'}
            </Button>
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>

            <div className="flex gap-4">
              <SocialLoginButton
                provider="facebook"
                onClick={() => handleSocialLogin('facebook')}
                className="flex-1"
              />
              <SocialLoginButton
                provider="google"
                onClick={() => handleSocialLogin('google')}
                className="flex-1"
              />
            </div>
          </>
        )}
      </div>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{' '}
        and <a href="#">Privacy Policy</a>.
      </div>
    </form>
  );
}
