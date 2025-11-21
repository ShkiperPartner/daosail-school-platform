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
import { Loader2, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { language } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Валидация на клиенте
    if (formData.password !== formData.confirmPassword) {
      setError(language === 'ru'
        ? 'Пароли не совпадают'
        : 'Passwords do not match'
      );
      return;
    }

    if (formData.password.length < 6) {
      setError(language === 'ru'
        ? 'Пароль должен содержать минимум 6 символов'
        : 'Password must be at least 6 characters long'
      );
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          }
        }
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        setSuccess(language === 'ru'
          ? 'Регистрация успешна! Проверьте свою почту для подтверждения аккаунта.'
          : 'Registration successful! Check your email to confirm your account.'
        );

        // Переадресация через 2 секунды
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      }

    } catch (err) {
      setError(language === 'ru'
        ? 'Произошла ошибка при регистрации'
        : 'An error occurred during registration'
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
            {language === 'ru' ? 'Регистрация' : 'Sign Up'}
          </CardTitle>
          <CardDescription className="text-center">
            {language === 'ru'
              ? 'Создайте аккаунт для доступа к DAOsail'
              : 'Create an account to access DAOsail'
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                {language === 'ru' ? 'Полное имя' : 'Full Name'}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder={language === 'ru' ? 'Введите ваше имя' : 'Enter your full name'}
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>

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
                  placeholder={language === 'ru' ? 'Создайте пароль' : 'Create a password'}
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {language === 'ru' ? 'Подтвердите пароль' : 'Confirm Password'}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={language === 'ru' ? 'Повторите пароль' : 'Repeat password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
                  {language === 'ru' ? 'Регистрация...' : 'Signing up...'}
                </>
              ) : (
                language === 'ru' ? 'Зарегистрироваться' : 'Sign Up'
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              {language === 'ru' ? 'Уже есть аккаунт?' : 'Already have an account?'}{' '}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                {language === 'ru' ? 'Войти' : 'Sign In'}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}