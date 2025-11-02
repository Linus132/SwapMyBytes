import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { LogoutUser } from '../router/routes';

interface UserContextType {
  userId: string | null;
  isLoggedIn: boolean;
  login: (id: string) => void;
  logout: () => void;
  isAuthChecked: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      setIsLoggedIn(true);
    }
    setIsAuthChecked(true);
  }, []);

  const login = (id: string) => {
    setUserId(id);
    setIsLoggedIn(true);
    localStorage.setItem('userId', id);
  };

  const logout = async () => {
    try {
      await LogoutUser(); 
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setUserId(null);
      setIsLoggedIn(false);
      localStorage.removeItem('userId'); // remove userId, even if the backend logout request fails
    }
  };

  return (
    <UserContext.Provider value={{ userId, isLoggedIn, login, logout, isAuthChecked }}>
      {children}
    </UserContext.Provider>
  );
};


export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
