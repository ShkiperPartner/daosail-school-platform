'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { profileService } from '@/lib/supabase/profile-service';
import { achievementService } from '@/lib/services/achievement-service';
import type { User } from '@supabase/supabase-js';
import type { UserProfile, UserRole } from '@/lib/types/profile';
import { createMockUserProfile } from '@/data/mock-profile';

interface NavigationEntry {
  url: string;
  title: string;
  timestamp: number;
  section?: string;
  contentType?: string;
  contentId?: string;
}

interface ChatSearchResult {
  chatSessionId: string;
  chatTitle: string;
  messageContent: string;
  messageRole: 'user' | 'assistant';
  assistantType?: 'navigator' | 'skipper';
  createdAt: string;
  rank: number;
}

interface AppContextType {
  // Theme & Language
  theme: 'light' | 'dark';
  language: 'en' | 'ru';
  responsesLeft: number;

  // Guest Flow
  guestStage: 'initial' | 'email_captured' | 'registration_required';
  emailCaptured: boolean;
  totalQuestionsAsked: number;

  // Authentication
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Profile
  userProfile: UserProfile | null;

  // Navigation Context
  navigationHistory: NavigationEntry[];
  currentNavigation: NavigationEntry | null;

  // Chat Search
  chatSearchResults: ChatSearchResult[];
  isSearching: boolean;

  // Theme & Language methods
  toggleTheme: () => void;
  toggleLanguage: () => void;
  decrementResponses: () => void;
  resetResponses: () => void;
  captureEmail: (email: string) => Promise<void>;

  // Authentication methods
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;

  // Profile methods
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  incrementStat: (stat: keyof UserProfile['stats']) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
  loadProfile: () => Promise<void>;

  // Navigation methods
  saveNavigationContext: (url: string, title: string, section?: string, contentType?: string, contentId?: string) => Promise<void>;
  getBackUrl: () => string | null;
  clearNavigationHistory: () => void;

  // Chat search methods
  searchChats: (query: string) => Promise<void>;
  clearChatSearch: () => void;

  // App reset method
  resetAppState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Theme & Language state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'en' | 'ru'>('en');
  const [responsesLeft, setResponsesLeft] = useState(3);

  // Guest Flow state
  const [guestStage, setGuestStage] = useState<'initial' | 'email_captured' | 'registration_required'>('initial');
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [totalQuestionsAsked, setTotalQuestionsAsked] = useState(0);

  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Navigation state
  const [navigationHistory, setNavigationHistory] = useState<NavigationEntry[]>([]);
  const [currentNavigation, setCurrentNavigation] = useState<NavigationEntry | null>(null);

  // Chat search state
  const [chatSearchResults, setChatSearchResults] = useState<ChatSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Helper functions
  const resetResponses = () => {
    setResponsesLeft(3);
    setTotalQuestionsAsked(0);
    setGuestStage('initial');
    setEmailCaptured(false);
  };

  const captureEmail = async (email: string) => {
    try {
      const supabase = createClient();

      // Сохраняем email для лид-генерации
      const { error } = await supabase
        .from('email_leads')
        .insert({
          email,
          source: 'chat_guest',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving email lead:', error);
        // Не блокируем UX из-за ошибки сохранения
      }

      // Обновляем состояние независимо от результата сохранения
      setEmailCaptured(true);
      setGuestStage('email_captured');
      setResponsesLeft(3); // Даем еще 3 вопроса

    } catch (error) {
      console.error('Error in captureEmail:', error);
      // Обновляем состояние даже при ошибке
      setEmailCaptured(true);
      setGuestStage('email_captured');
      setResponsesLeft(3);
    }
  };

  // Load profile from Supabase
  const loadProfile = useCallback(async () => {
    if (!user) return;

    console.log('Loading profile for user:', user.id);
    setProfileLoading(true);
    try {
      const fullProfile = await profileService.getFullProfile(user.id);

      if (fullProfile) {
        const appProfile = profileService.transformToAppProfile(fullProfile);
        // Update email from auth user
        appProfile.email = user.email || '';
        setUserProfile(appProfile);
      } else {
        // If no profile exists, create initial profile records
        await createInitialProfile(user);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to mock profile
      const profile = createMockUserProfile(
        user.email || '',
        user.user_metadata?.full_name || 'Пользователь'
      );
      setUserProfile(profile);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  // Create initial profile records for new user
  const createInitialProfile = async (authUser: User) => {
    try {
      console.log('Creating initial profile for user:', authUser.id);

      const supabase = createClient();
      const now = new Date().toISOString();
      const fullName = authUser.user_metadata?.full_name || 'Пользователь';

      // Create profile record
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          full_name: fullName,
          nickname: null,
          avatar_url: null,
          city: null,
          bio: null,
          role: 'Интересующийся',
          join_date: now
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating profile:', profileError);
        throw profileError;
      }

      // Create user_stats record
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .insert({
          id: authUser.id,
          questions_asked: 0,
          lessons_completed: 0,
          articles_read: 0,
          community_messages: 0,
          last_login_date: now,
          total_logins: 1
        })
        .select()
        .single();

      if (statsError) {
        console.error('Error creating user stats:', statsError);
        throw statsError;
      }

      console.log('Initial profile created successfully');

      // Now load the full profile
      const fullProfile = await profileService.getFullProfile(authUser.id);
      if (fullProfile) {
        const appProfile = profileService.transformToAppProfile(fullProfile);
        appProfile.email = authUser.email || '';
        setUserProfile(appProfile);
      }

    } catch (error) {
      console.error('Database error saving new user:', error);

      // Fallback to mock profile if database fails
      const profile = createMockUserProfile(
        authUser.email || '',
        authUser.user_metadata?.full_name || 'Пользователь'
      );
      setUserProfile(profile);
    }
  };

  // Initialize auth state and listen to auth changes
  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          resetResponses(); // Reset responses for authenticated users
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);

        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          resetResponses();
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setUserProfile(null);
        }

        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load profile when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfile();
    }
  }, [isAuthenticated, user, loadProfile]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const unsubscribe = profileService.subscribeToProfile(user.id, (fullProfile) => {
      if (fullProfile) {
        const appProfile = profileService.transformToAppProfile(fullProfile);
        appProfile.email = user.email || '';
        setUserProfile(appProfile);

        // Check for new achievements and show notifications
        if (userProfile && appProfile.achievements.length > userProfile.achievements.length) {
          const newAchievements = appProfile.achievements.slice(0, appProfile.achievements.length - userProfile.achievements.length);
          newAchievements.forEach(achievement => {
            console.log('🏆 New achievement unlocked:', achievement.title);
            // Here you could show a toast notification
          });
        }
      }
    });

    return unsubscribe;
  }, [user, userProfile]);

  // Load saved preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const savedLanguage = localStorage.getItem('language') as 'en' | 'ru' | null;
      const savedResponses = localStorage.getItem('responsesLeft');

      if (savedTheme) {
        setTheme(savedTheme);
      }
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
      if (savedResponses && !isAuthenticated) {
        // Only use saved responses if user is not authenticated
        setResponsesLeft(parseInt(savedResponses, 10));
      }
    }
  }, [isAuthenticated]);

  // Apply theme to document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  // Save language preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
    }
  }, [language]);

  // Save responses left
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('responsesLeft', responsesLeft.toString());
    }
  }, [responsesLeft]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ru' : 'en');
  };

  const decrementResponses = () => {
    setResponsesLeft(prev => Math.max(0, prev - 1));

    // Обновляем стадию гостевого режима
    if (!isAuthenticated) {
      const newTotal = totalQuestionsAsked + 1;
      setTotalQuestionsAsked(newTotal);

      if (newTotal === 3 && !emailCaptured) {
        // После 3-го вопроса без email - предлагаем захват email
        setGuestStage('initial');
      } else if (newTotal === 6) {
        // После 6-го вопроса - требуем регистрацию
        setGuestStage('registration_required');
        setResponsesLeft(0); // Блокируем дальнейшие вопросы
      }
    } else {
      setTotalQuestionsAsked(prev => prev + 1);
    }
  };

  // Authentication methods
  const signOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }

    // State will be updated automatically by the auth state listener
  };

  const refreshUser = async () => {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Refresh user error:', error);
      throw error;
    }

    if (user) {
      setUser(user);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
      setUserProfile(null);
    }
  };

  // Profile methods
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) return;

    try {
      // Update in Supabase
      const profileUpdates: any = {};
      if (updates.fullName) profileUpdates.full_name = updates.fullName;
      if (updates.nickname) profileUpdates.nickname = updates.nickname;
      if (updates.city) profileUpdates.city = updates.city;
      if (updates.bio) profileUpdates.bio = updates.bio;

      if (Object.keys(profileUpdates).length > 0) {
        const success = await profileService.updateProfile(user.id, profileUpdates);
        if (!success) {
          console.error('Failed to update profile in Supabase');
          return;
        }
      }

      // Update local state
      setUserProfile({ ...userProfile, ...updates });
      console.log('Profile updated:', updates);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const incrementStat = async (stat: keyof UserProfile['stats']) => {
    if (!user || !userProfile) return;

    try {
      // Map frontend stat names to backend column names
      const statMapping: Record<keyof UserProfile['stats'], string> = {
        questionsAsked: 'questions_asked',
        lessonsCompleted: 'lessons_completed',
        articlesRead: 'articles_read',
        communityMessages: 'community_messages',
        lastLoginDate: 'last_login_date',
        totalLogins: 'total_logins'
      };

      const backendStatName = statMapping[stat];
      if (!backendStatName) return;

      // For date fields, use different logic
      if (stat === 'lastLoginDate') {
        const success = await profileService.updateStats(user.id, {
          [backendStatName]: new Date().toISOString()
        });
        if (!success) return;

        setUserProfile({
          ...userProfile,
          stats: {
            ...userProfile.stats,
            lastLoginDate: new Date()
          }
        });
      } else {
        // For numeric fields, increment
        const success = await profileService.incrementStat(user.id, backendStatName as any);
        if (!success) return;

        const currentValue = userProfile.stats[stat] as number;
        const newValue = currentValue + 1;

        const updatedProfile = {
          ...userProfile,
          stats: {
            ...userProfile.stats,
            [stat]: newValue
          }
        };

        setUserProfile(updatedProfile);

        if (stat === 'questionsAsked') {
          decrementResponses();
        }

        // Check for new achievements after stat update
        try {
          await achievementService.checkAndAddAchievements(user.id, updatedProfile);
        } catch (error) {
          console.error('Error checking achievements:', error);
        }

        // Check for role promotion
        try {
          const newRole = await profileService.checkAndPromoteRole(user.id);
          if (newRole && newRole !== updatedProfile.role) {
            console.log(`🎖️ Role promoted to: ${newRole}`);

            // Update local profile with new role
            setUserProfile(prev => prev ? { ...prev, role: newRole as UserRole } : null);

            // Add role promotion achievement
            await achievementService.checkAndAddAchievements(user.id, { ...updatedProfile, role: newRole as UserRole });
          }
        } catch (error) {
          console.error('Error checking role promotion:', error);
        }
      }

      console.log(`Updated ${stat}`);
    } catch (error) {
      console.error('Error incrementing stat:', error);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const avatarUrl = await profileService.uploadAvatar(user.id, file);
      if (avatarUrl && userProfile) {
        setUserProfile({
          ...userProfile,
          avatarUrl
        });
      }
      return avatarUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  // Navigation methods
  const saveNavigationContext = async (
    url: string,
    title: string,
    section?: string,
    contentType?: string,
    contentId?: string
  ) => {
    if (!user) {
      // For guests, save only in memory
      const entry: NavigationEntry = {
        url,
        title,
        timestamp: Date.now(),
        section,
        contentType,
        contentId
      };
      setNavigationHistory(prev => [entry, ...prev.slice(0, 9)]); // Keep last 10
      setCurrentNavigation(entry);
      return;
    }

    try {
      const supabase = createClient();

      const entry: NavigationEntry = {
        url,
        title,
        timestamp: Date.now(),
        section,
        contentType,
        contentId
      };

      // Save to Supabase (check if we're in browser)
      if (typeof window !== 'undefined') {
        const { error } = await supabase
          .from('navigation_history')
          .insert({
            user_id: user.id,
            previous_url: url,
            previous_title: title,
            current_url: window.location.pathname,
            section,
            content_type: contentType,
            content_id: contentId,
            scroll_position: window.scrollY || 0,
            viewport_width: window.innerWidth || 0,
            viewport_height: window.innerHeight || 0,
            user_agent: navigator.userAgent || '',
            session_id: `session_${Date.now()}`
          });

        if (error) {
          console.error('Error saving navigation context:', error);
        }
      }

      // Update local state
      setNavigationHistory(prev => [entry, ...prev.slice(0, 9)]);
      setCurrentNavigation(entry);

    } catch (error) {
      console.error('Error in saveNavigationContext:', error);
    }
  };

  const getBackUrl = (): string | null => {
    if (navigationHistory.length > 0) {
      return navigationHistory[0].url;
    }
    return null;
  };

  const clearNavigationHistory = () => {
    setNavigationHistory([]);
    setCurrentNavigation(null);
  };

  // Chat search methods
  const searchChats = async (query: string) => {
    if (!user || !query.trim()) {
      setChatSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const supabase = createClient();

      // Call the search function we created
      const { data, error } = await supabase.rpc('search_user_chats', {
        search_query: query.trim(),
        user_uuid: user.id,
        limit_count: 20
      });

      if (error) {
        console.error('Search error:', error);
        setChatSearchResults([]);
      } else {
        const results: ChatSearchResult[] = (data || []).map((item: any) => ({
          chatSessionId: item.chat_session_id,
          chatTitle: item.chat_title || 'Untitled Chat',
          messageContent: item.message_content,
          messageRole: item.message_role,
          assistantType: item.assistant_type,
          createdAt: item.created_at,
          rank: item.rank
        }));
        setChatSearchResults(results);
      }
    } catch (error) {
      console.error('Error searching chats:', error);
      setChatSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearChatSearch = () => {
    setChatSearchResults([]);
    setIsSearching(false);
  };

  // App reset method - полный сброс состояния приложения
  const resetAppState = () => {
    // Сброс guest flow состояний
    setGuestStage('initial');
    setEmailCaptured(false);
    setTotalQuestionsAsked(0);
    setResponsesLeft(3);

    // Сброс навигации
    clearNavigationHistory();

    // Сброс поиска
    clearChatSearch();

    // Очистка localStorage для гостевых настроек
    if (typeof window !== 'undefined') {
      localStorage.removeItem('guestStage');
      localStorage.removeItem('emailCaptured');
      localStorage.removeItem('totalQuestionsAsked');
      localStorage.removeItem('responsesLeft');
    }

    console.log('App state reset to initial values');
  };

  return (
    <AppContext.Provider value={{
      // Theme & Language
      theme,
      language,
      responsesLeft,

      // Guest Flow
      guestStage,
      emailCaptured,
      totalQuestionsAsked,

      // Authentication
      user,
      isAuthenticated,
      isLoading,

      // Profile
      userProfile,

      // Navigation Context
      navigationHistory,
      currentNavigation,

      // Chat Search
      chatSearchResults,
      isSearching,

      // Theme & Language methods
      toggleTheme,
      toggleLanguage,
      decrementResponses,
      resetResponses,
      captureEmail,

      // Authentication methods
      signOut,
      refreshUser,

      // Profile methods
      updateProfile,
      incrementStat,
      uploadAvatar,
      loadProfile,

      // Navigation methods
      saveNavigationContext,
      getBackUrl,
      clearNavigationHistory,

      // Chat search methods
      searchChats,
      clearChatSearch,

      // App reset method
      resetAppState,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}