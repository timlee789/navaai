'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 사용자 프로필 로드 - 더 간단하게
  const loadUser = async () => {
    console.log('🔄 AuthContext: Starting loadUser...');
    try {
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        credentials: 'include', // 쿠키 포함
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      console.log('📡 AuthContext: Profile API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ AuthContext: User data loaded:', data.user);
        setUser(data.user);
      } else {
        console.log('❌ AuthContext: Profile API failed, setting user to null');
        setUser(null);
      }
    } catch (error) {
      console.error('💥 AuthContext: User loading error:', error);
      setUser(null);
    } finally {
      console.log('🏁 AuthContext: Setting loading to false');
      setLoading(false);
    }
  };

  // Login - 더 간단하게
  const login = async (email, password) => {
    console.log('🔐 AuthContext: Starting login for email:', email);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // 쿠키 포함
      });

      console.log('📡 AuthContext: Login API response status:', response.status);
      const data = await response.json();
      console.log('📊 AuthContext: Login API response data:', data);

      if (response.ok) {
        console.log('✅ AuthContext: Login successful, setting user:', data.user);
        setUser(data.user);
        return { success: true, message: data.message, user: data.user };
      } else {
        console.log('❌ AuthContext: Login failed:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('💥 AuthContext: Login error:', error);
      return { success: false, error: 'A network error occurred' };
    }
  };

  // Register
  const register = async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'A network error occurred' };
    }
  };

  // Logout
  const logout = async () => {
    console.log('🚪 AuthContext: Starting logout...');
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      console.log('✅ AuthContext: Logout completed');
    } catch (error) {
      console.error('💥 AuthContext: Logout error:', error);
    }
  };

  // Update SNS settings
  const updateSnsSettings = async (snsSettings) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ snsSettings }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('SNS settings update error:', error);
      return { success: false, error: 'A network error occurred' };
    }
  };

  // 초기 로드
  useEffect(() => {
    console.log('🚀 AuthContext: Component mounted, loading user...');
    loadUser();
  }, []);

  // 사용자 상태 변경 시 로그
  useEffect(() => {
    console.log('👤 AuthContext: User state changed:', user ? `${user.email} (${user.id})` : 'null');
  }, [user]);

  // 로딩 상태 변경 시 로그
  useEffect(() => {
    console.log('⏳ AuthContext: Loading state changed:', loading);
  }, [loading]);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateSnsSettings,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}