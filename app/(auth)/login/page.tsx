'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppContext } from '@/lib/contexts/app-context';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { language } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        // Обработка разных типов ошибок
        if (error.message.includes('Invalid login credentials')) {
          setError(language === 'ru'
            ? 'Неверный email или пароль'
            : 'Invalid email or password'
          );
        } else if (error.message.includes('Email not confirmed')) {
          setError(language === 'ru'
            ? 'Подтвердите ваш email перед входом'
            : 'Please confirm your email before signing in'
          );
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.user) {
        setSuccess(language === 'ru'
          ? 'Вход выполнен успешно!'
          : 'Sign in successful!'
        );

        // Переадресация через 1 секунду
        setTimeout(() => {
          router.push('/profile');
        }, 1000);
      }

    } catch (err) {
      setError(language === 'ru'
        ? 'Произошла ошибка при входе'
        : 'An error occurred during sign in'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {language === 'ru' ? 'Вход' : 'Sign In'}
          </CardTitle>
          <CardDescription className="text-center">
            {language === 'ru'
              ? 'Войдите в свой аккаунт DAOsail'
              : 'Sign in to your DAOsail account'
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                {language === 'ru' ? 'Электронная почта' : 'Email'}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder={language === 'ru' ? 'Введите email' : 'Enter your email'}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                {language === 'ru' ? 'Пароль' : 'Password'}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={language === 'ru' ? 'Введите пароль' : 'Enter your password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {language === 'ru' ? 'Забыли пароль?' : 'Forgot password?'}
              </Link>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="border-green-200 text-green-800 bg-green-50">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'ru' ? 'Входим...' : 'Signing in...'}
                </>
              ) : (
                language === 'ru' ? 'Войти' : 'Sign In'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {language === 'ru' ? 'или' : 'or'}
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {language === 'ru' ? 'Нет аккаунта?' : "Don't have an account?"}{' '}
              <Link
                href="/signup"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                {language === 'ru' ? 'Зарегистрироваться' : 'Sign up'}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}