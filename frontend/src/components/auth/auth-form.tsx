import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/form-field.tsx";
import { SocialLoginButton } from "@/components/auth/social-login-button.tsx";
import { GalleryVerticalEnd } from "lucide-react";
import { loginSchema, registerSchema, resetPasswordSchema } from "@/components/util/form-schemas.ts";
import { calculatePasswordStrength } from "@/components/util/password-utils.ts";
import { UsersApiClient } from "@/lib/api/users.ts";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {authenticationProviderInstance} from "@/lib/authentication-provider.ts";

interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

interface AuthFormProps extends React.ComponentPropsWithoutRef<"form"> {
  isRegister?: boolean;
}

export function AuthForm({
  className,
  isRegister = false,
  ...props
}: AuthFormProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(isRegister);
  const [isSocialLogin, setIsSocialLogin] = useState(false);
  const [isResetPasswordMode, setIsResetPasswordMode] = useState(false);
  const [password, setPassword] = useState("");
  const schema = isRegisterMode ? registerSchema : loginSchema;
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(isResetPasswordMode ? resetPasswordSchema : schema),
  });

  const toggleFormMode = () => {
    setIsRegisterMode((prevMode) => !prevMode);
    reset();
  };

  const toggleResetPasswordMode = () => {
    setIsResetPasswordMode((prevMode) => !prevMode);
    reset();
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const usersApiClient = new UsersApiClient(authenticationProviderInstance);
      let response;

      if (isRegisterMode) {
        response = await usersApiClient.createUser({ email: data.email, password: data.password });
        } else {
        response = await usersApiClient.loginUser({ email: data.email, password: data.password });
      }

      if (response.token) {
        authenticationProviderInstance.login(response.token);
        console.log("Logged in!");
      }
    } catch (error) {
      console.error("Error during registration:", error);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'apple') => {
    setIsSocialLogin(true);
    if (provider === 'google') {
      window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    } else if (provider === 'apple') {
      window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    }
  };

  const passwordStrength = calculatePasswordStrength(password);

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSubmit(onSubmit)}>
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
                Already have an account?{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); toggleFormMode(); }} className="underline underline-offset-4">
                  Sign in
                </a>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); toggleFormMode(); }} className="underline underline-offset-4">
                  Sign up
                </a>
              </>
            )}
          </div>
        )}
      </div>
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
            <a href="#" onClick={(e) => { e.preventDefault(); toggleResetPasswordMode(); }} className="underline underline-offset-4 text-center">
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
                    onClick={(e) => { e.preventDefault(); toggleResetPasswordMode(); }}
                  >
                    Forgot your password?
                  </a>
                )}
              </div>
              <Input
                id="password"
                type="password"
                {...register("password")}
                aria-invalid={errors.password ? "true" : "false"}
                className={errors.password ? "border-red-500" : ""}
                onChange={(e) => setPassword(e.target.value)}
              />
              {isRegisterMode && (
                <div className="relative w-full h-2 bg-gray-200 rounded">
                  <div
                    className={cn("absolute h-full rounded", {
                      "bg-red-500": passwordStrength <= 2,
                      "bg-yellow-500": passwordStrength === 3,
                      "bg-green-500": passwordStrength >= 4,
                    })}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  />
                </div>
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
              {isRegisterMode ? "Register" : "Login"}
            </Button>
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
            <SocialLoginButton provider="apple" onClick={() => handleSocialLogin('apple')} />
            <SocialLoginButton provider="google" onClick={() => handleSocialLogin('google')} />
          </>
        )}
      </div>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </div>
    </form>
  );
}