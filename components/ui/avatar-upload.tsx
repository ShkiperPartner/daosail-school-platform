'use client';

import React, { useState, useRef } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { useAppContext } from '@/lib/contexts/app-context';

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange?: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

export function AvatarUpload({
  currentAvatar,
  onAvatarChange,
  size = 'md',
  editable = true
}: AvatarUploadProps) {
  const { uploadAvatar, language } = useAppContext();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-20 w-20',
    lg: 'h-32 w-32'
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(language === 'ru' ? 'Пожалуйста, выберите изображение' : 'Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(language === 'ru' ? 'Размер файла должен быть меньше 5МБ' : 'File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload avatar
    setIsUploading(true);
    try {
      const uploadedUrl = await uploadAvatar(file);

      if (uploadedUrl) {
        onAvatarChange?.(uploadedUrl);
      } else {
        alert(language === 'ru' ? 'Ошибка при загрузке изображения' : 'Error uploading image');
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert(language === 'ru' ? 'Ошибка при загрузке изображения' : 'Error uploading image');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarClick = () => {
    if (editable && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const displayUrl = previewUrl || currentAvatar;

  return (
    <div className="relative inline-block">
      <div
        className={`
          ${sizeClasses[size]}
          relative rounded-full overflow-hidden bg-muted
          flex items-center justify-center border-2 border-border
          ${editable ? 'cursor-pointer hover:border-primary transition-colors' : 'cursor-default'}
        `}
        onClick={handleAvatarClick}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={language === 'ru' ? 'Аватар пользователя' : 'User avatar'}
            className="h-full w-full object-cover"
          />
        ) : (
          <User className={`${iconSizeClasses[size]} text-muted-foreground`} />
        )}

        {/* Upload overlay */}
        {editable && (
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            {isUploading ? (
              <Loader2 className={`${iconSizeClasses[size]} text-white animate-spin`} />
            ) : (
              <Camera className={`${iconSizeClasses[size]} text-white`} />
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      )}

      {/* Upload status */}
      {isUploading && (
        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
          <Loader2 className="h-3 w-3 animate-spin" />
        </div>
      )}
    </div>
  );
}