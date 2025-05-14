import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const setSession = (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting session:', error);
    }
  };
  
  export const getSession = (key: string): unknown | null => {
    try {
      const value: string | null = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  };
  
  export const removeSession = (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing session:', error);
    }
  };

  export const logOut = () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('username');
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Error removing session:', error);
    }
  };
  
  export const clearSession = () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing session:', error);
    }
    
  };


  export const getUser = () => {
    try {
      const user: string | null = localStorage.getItem('user');
      if (user === 'undefined' || !user) {
        return null;
      } else {
        return JSON.parse(user);
      }
    } catch (error) {
      console.error('Error retrieving user from session:', error);
      return null;
    }
  };


  export const getToken = () => {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.error('Error retrieving Token', error);
      return null; 
    }
  };

  type UserRole = 1 | 2 | 3;

  export const useAuthGuard = (allowedRoles: UserRole[]) => {
    const navigate = useNavigate();
  
    useEffect(() => {
      const user = getUser();
  
      if (!user) {
        navigate('/login');
        return;
      }
  
      if (!allowedRoles.includes(user.role)) {
        navigate('/');
      }
    }, [navigate, allowedRoles]);
  
    return;
  };
  