import { useState, useEffect, useCallback } from 'react';
import {
    signIn as amplifySignIn,
    signUp as amplifySignUp,
    signOut as amplifySignOut,
    confirmSignUp as amplifyConfirmSignUp,
    getCurrentUser,
    fetchAuthSession,
    type SignInInput,
    type SignUpInput,
    type ConfirmSignUpInput,
} from 'aws-amplify/auth';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface AuthUser {
    userId: string;
    username: string;
}

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: AuthUser | null;
    error: string | null;
}

interface UseAuthReturn extends AuthState {
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, givenName: string, familyName: string) => Promise<{ isConfirmed: boolean }>;
    confirmSignUp: (email: string, code: string) => Promise<void>;
    signOut: () => Promise<void>;
    getAccessToken: () => Promise<string | null>;
    clearError: () => void;
}

// ----------------------------------------------------------------
// Hook
// ----------------------------------------------------------------

export function useAuth(): UseAuthReturn {
    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        error: null,
    });

    // Check current auth state on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const user = await getCurrentUser();
            setState({
                isAuthenticated: true,
                isLoading: false,
                user: {
                    userId: user.userId,
                    username: user.username,
                },
                error: null,
            });
        } catch {
            setState({
                isAuthenticated: false,
                isLoading: false,
                user: null,
                error: null,
            });
        }
    };

    const signIn = useCallback(async (email: string, password: string) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const input: SignInInput = { username: email, password };
            await amplifySignIn(input);
            await checkAuth();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Sign in failed';
            setState(prev => ({ ...prev, isLoading: false, error: message }));
            throw err;
        }
    }, []);

    const signUp = useCallback(async (
        email: string,
        password: string,
        givenName: string,
        familyName: string,
    ) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const input: SignUpInput = {
                username: email,
                password,
                options: {
                    userAttributes: {
                        email,
                        given_name: givenName,
                        family_name: familyName,
                    },
                },
            };
            const result = await amplifySignUp(input);
            const isConfirmed = result.isSignUpComplete;

            setState(prev => ({ ...prev, isLoading: false }));
            return { isConfirmed };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Sign up failed';
            setState(prev => ({ ...prev, isLoading: false, error: message }));
            throw err;
        }
    }, []);

    const confirmSignUpFn = useCallback(async (email: string, code: string) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const input: ConfirmSignUpInput = {
                username: email,
                confirmationCode: code,
            };
            await amplifyConfirmSignUp(input);
            setState(prev => ({ ...prev, isLoading: false }));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Confirmation failed';
            setState(prev => ({ ...prev, isLoading: false, error: message }));
            throw err;
        }
    }, []);

    const signOutFn = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            await amplifySignOut();
            setState({
                isAuthenticated: false,
                isLoading: false,
                user: null,
                error: null,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Sign out failed';
            setState(prev => ({ ...prev, isLoading: false, error: message }));
            throw err;
        }
    }, []);

    const getAccessToken = useCallback(async (): Promise<string | null> => {
        try {
            const session = await fetchAuthSession();
            return session.tokens?.accessToken?.toString() ?? null;
        } catch {
            return null;
        }
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    return {
        ...state,
        signIn,
        signUp,
        confirmSignUp: confirmSignUpFn,
        signOut: signOutFn,
        getAccessToken,
        clearError,
    };
}

export default useAuth;
