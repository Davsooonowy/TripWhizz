import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema } from '@/components/util/form-schemas.ts';
import { UsersApiClient } from '@/lib/api/users.ts';
import { authenticationProviderInstance } from '@/lib/authentication-provider.ts';
import { FormField } from '@/components/auth/form-field.tsx';
import { Button } from '@/components/ui/button';

interface FormData {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
  });
  const [error, setError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const usersApiClient = new UsersApiClient(authenticationProviderInstance);
      await usersApiClient.resetPassword(uid!, token!, data.newPassword);
      alert('Password reset successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Failed to reset password. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Reset Password</h1>
      {error && <p className="text-red-500">{error}</p>}
      <FormField
        id="newPassword"
        label="New Password"
        type="password"
        register={register}
        error={errors.newPassword?.message}
      />
      <FormField
        id="confirmPassword"
        label="Confirm Password"
        type="password"
        register={register}
        error={errors.confirmPassword?.message}
      />
      <Button type="submit" className="w-full">
        Reset Password
      </Button>
    </form>
  );
}
