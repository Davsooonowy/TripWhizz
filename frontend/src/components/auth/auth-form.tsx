import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GalleryVerticalEnd } from "lucide-react";

interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const loginSchema = z.object({
  email: z.string().email("Invalid email address").nonempty("Email is required"),
  password: passwordSchema,
});

const registerSchema = loginSchema.extend({
  confirmPassword: z.string().nonempty("Confirm Password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address").nonempty("Email is required"),
});

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

  const onSubmit: SubmitHandler<FormData> = (data) => {
    if (isResetPasswordMode) {
      console.log("Reset password for:", data.email);
    } else if (!isSocialLogin) {
      console.log(data);
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

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...register("email")}
              aria-invalid={errors.email ? "true" : "false"}
              className={errors.email ? "border-red-500" : ""}
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
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
                className={errors.email ? "border-red-500" : ""}
              />
            </div>
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
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  {...register("confirmPassword")}
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
              </div>
            )}
            <Button type="submit" className="w-full">
              {isRegisterMode ? "Register" : "Login"}
            </Button>
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
            <Button variant="outline" className="w-full" onClick={() => handleSocialLogin('apple')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                  fill="currentColor"
                />
              </svg>
              Continue with Apple
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleSocialLogin('google')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Continue with Google
            </Button>
          </>
        )}
      </div>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </div>
    </form>
  );
}