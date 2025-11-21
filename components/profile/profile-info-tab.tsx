'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import {
  User,
  Edit,
  Save,
  MapPin,
  Mail,
  Calendar,
  MessageSquare,
  BookOpen,
  Users,
  Clock
} from 'lucide-react';
import { useAppContext } from '@/lib/contexts/app-context';
import { getRoleConfig } from '@/lib/config/roles';

export function ProfileInfoTab() {
  const { language, userProfile, updateProfile } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: userProfile?.fullName || '',
    nickname: userProfile?.nickname || '',
    city: userProfile?.city || '',
    bio: userProfile?.bio || ''
  });

  if (!userProfile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {language === 'ru' ? 'Загрузка профиля...' : 'Loading profile...'}
        </p>
      </div>
    );
  }

  const roleConfig = getRoleConfig(userProfile.role);

  const handleSave = () => {
    updateProfile(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      fullName: userProfile.fullName,
      nickname: userProfile.nickname || '',
      city: userProfile.city || '',
      bio: userProfile.bio || ''
    });
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {language === 'ru' ? 'Информация профиля' : 'Profile Information'}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing
              ? (language === 'ru' ? 'Отмена' : 'Cancel')
              : (language === 'ru' ? 'Редактировать' : 'Edit')
            }
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <AvatarUpload
              currentAvatar={userProfile.avatarUrl}
              size="lg"
              editable={isEditing}
              onAvatarChange={(url) => {
                updateProfile({ avatarUrl: url });
              }}
            />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{userProfile.fullName}</h3>
              <Badge
                variant="outline"
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
              >
                {language === 'ru' ? roleConfig.titleRu : roleConfig.title}
              </Badge>
              {userProfile.nickname && (
                <p className="text-sm text-muted-foreground">
                  @{userProfile.nickname}
                </p>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                {language === 'ru' ? 'Полное имя' : 'Full Name'}
              </Label>
              <Input
                id="fullName"
                value={isEditing ? editData.fullName : userProfile.fullName}
                onChange={(e) => setEditData(prev => ({ ...prev, fullName: e.target.value }))}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">
                {language === 'ru' ? 'Никнейм' : 'Nickname'}
              </Label>
              <Input
                id="nickname"
                value={isEditing ? editData.nickname : userProfile.nickname || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, nickname: e.target.value }))}
                disabled={!isEditing}
                placeholder={language === 'ru' ? 'Введите никнейм' : 'Enter nickname'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={userProfile.email}
                  disabled
                  className="bg-muted/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">
                {language === 'ru' ? 'Город' : 'City'}
              </Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="city"
                  value={isEditing ? editData.city : userProfile.city || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
                  disabled={!isEditing}
                  placeholder={language === 'ru' ? 'Введите город' : 'Enter city'}
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">
              {language === 'ru' ? 'О себе' : 'Bio'}
            </Label>
            <Textarea
              id="bio"
              value={isEditing ? editData.bio : userProfile.bio || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
              disabled={!isEditing}
              placeholder={language === 'ru'
                ? 'Расскажите немного о себе...'
                : 'Tell us a bit about yourself...'
              }
              rows={3}
            />
          </div>

          {/* Save/Cancel buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                {language === 'ru' ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                {language === 'ru' ? 'Сохранить' : 'Save'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline" className="mr-2">
              {language === 'ru' ? roleConfig.titleRu : roleConfig.title}
            </Badge>
            {language === 'ru' ? 'Возможности текущего уровня' : 'Current Level Capabilities'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            {language === 'ru' ? roleConfig.descriptionRu : roleConfig.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center space-y-2">
              <MessageSquare className="h-8 w-8 mx-auto text-primary" />
              <h4 className="font-medium">
                {language === 'ru' ? 'ИИ Консультанты' : 'AI Consultants'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {roleConfig.permissions.includes('chat_with_skipper') &&
                 roleConfig.permissions.includes('chat_with_navigator') ?
                  (language === 'ru' ? 'Полный доступ' : 'Full Access') :
                  (language === 'ru' ? 'Базовый доступ' : 'Basic Access')
                }
              </p>
            </div>

            <div className="text-center space-y-2">
              <BookOpen className="h-8 w-8 mx-auto text-primary" />
              <h4 className="font-medium">
                {language === 'ru' ? 'Обучение' : 'Learning'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {roleConfig.permissions.includes('access_simulations') ?
                  (language === 'ru' ? 'Симуляции доступны' : 'Simulations Available') :
                  (language === 'ru' ? 'Базовые материалы' : 'Basic Materials')
                }
              </p>
            </div>

            <div className="text-center space-y-2">
              <Users className="h-8 w-8 mx-auto text-primary" />
              <h4 className="font-medium">
                {language === 'ru' ? 'Сообщество' : 'Community'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {roleConfig.permissions.includes('participate_in_community') ?
                  (language === 'ru' ? 'Участие разрешено' : 'Participation Allowed') :
                  (language === 'ru' ? 'Только просмотр' : 'View Only')
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'ru' ? 'Общая статистика' : 'General Statistics'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2 p-4 border rounded-lg">
              <MessageSquare className="h-6 w-6 mx-auto text-blue-500" />
              <div className="font-semibold text-lg">{userProfile.stats.questionsAsked}</div>
              <div className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Вопросов задано' : 'Questions Asked'}
              </div>
            </div>

            <div className="text-center space-y-2 p-4 border rounded-lg">
              <BookOpen className="h-6 w-6 mx-auto text-green-500" />
              <div className="font-semibold text-lg">{userProfile.stats.lessonsCompleted}</div>
              <div className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Уроков пройдено' : 'Lessons Completed'}
              </div>
            </div>

            <div className="text-center space-y-2 p-4 border rounded-lg">
              <Users className="h-6 w-6 mx-auto text-purple-500" />
              <div className="font-semibold text-lg">{userProfile.stats.communityMessages}</div>
              <div className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Сообщений в чате' : 'Community Messages'}
              </div>
            </div>

            <div className="text-center space-y-2 p-4 border rounded-lg">
              <Calendar className="h-6 w-6 mx-auto text-orange-500" />
              <div className="font-semibold text-sm">
                {formatDate(userProfile.joinDate)}
              </div>
              <div className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Дата регистрации' : 'Join Date'}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {language === 'ru' ? 'Последний визит:' : 'Last visit:'}
              </span>
            </div>
            <span className="text-sm font-medium">
              {formatDate(userProfile.stats.lastLoginDate)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}