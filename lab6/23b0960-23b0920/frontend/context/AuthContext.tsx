import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiCall } from '../utils/api';
import { useRouter } from 'expo-router';

interface User {
    username: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    login: (username: string) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
    retry: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: false,
    error: null,
    login: () => { },
    logout: () => { },
    checkAuth: async () => { },
    retry: () => { },
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const checkAuth = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // silent: true because we handle the error here manually
            const data = await apiCall('/isLoggedIn', { silent: true, timeout: 5000 });
            setUser({ username: data.username });
        } catch (error: any) {
            // If it's a network error or timeout, set error state for full screen error
            if (error.name === 'AbortError' || (error.message && error.message.includes('Network request failed'))) {
                setError(error.message || 'Network error');
            } else if (error.status === 401 || error.status === 403) {
                // 401 means just not logged in, which is fine
                setUser(null);
            } else {
                // Other errors also treated as logged out or we could show error
                // For now, assume logged out if not network error
                setUser(null);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const retry = () => {
        checkAuth();
    };

    const login = (username: string) => {
        setUser({ username });
        router.replace('/(tabs)');
    };

    const logout = async () => {
        try {
            await apiCall('/logout', { method: 'POST' });
            setUser(null);
            router.replace('/(auth)/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, error, login, logout, checkAuth, retry }}>
            {children}
        </AuthContext.Provider>
    );
};
