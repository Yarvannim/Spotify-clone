import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import { keycloak, initKeycloak} from "./keycloak.ts";
import {userApiService, type UserProfile} from "../services/UserApi.ts";
import type {PrivacyPreferences, PrivacyPreferencesUpdateRequest} from "../types/Privacy.ts";
import {privacyApiService} from "../services/PrivacyApi.ts";

interface AuthContextType {
    isAuthenticated: boolean;
    user: any;
    userProfile: UserProfile | null;
    privacyPreferences: PrivacyPreferences | null;
    login: () => void;
    logout: () => void;
    register: () => void;
    hasRole: (roles: string[]) => boolean;
    loading: boolean;
    syncUserProfile: () => Promise<void>;
    refreshUserProfile: () => Promise<void>;
    updateDisplayName: (displayName: string) => Promise<void>;
    refreshPrivacyPreferences: () => Promise<void>;
    updatePrivacyPreferences: (preferences: PrivacyPreferencesUpdateRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode}> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [privacyPreferences, setPrivacyPreferences] = useState<PrivacyPreferences | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshPrivacyPreferences = useCallback(async (): Promise<void> => {
        if (!keycloak.authenticated) return;

        try {
            const preferences = await privacyApiService.getPrivacyPreferences();
            setPrivacyPreferences(preferences);
        } catch (error) {
            console.error('Failed to refresh privacy preferences:', error);
            setPrivacyPreferences({
                userId: user?.sub || '',
                dataProcessingConsent: false,
                dataSharingConsent: false,
                marketingConsent: false,
                consentGivenAt: '',
                preferencesUpdatedAt: ''
            });
        }
    }, [user]);

    const updatePrivacyPreferences = useCallback(async (preferences: PrivacyPreferencesUpdateRequest): Promise<void> => {
        try {
            const updated = await privacyApiService.updatePrivacyPreferences(preferences);
            setPrivacyPreferences(updated);
        } catch (error) {
            throw new Error('Failed to update privacy preferences');
        }
    }, [])

    const syncUserProfile = useCallback(async (): Promise<void> => {
        if (!keycloak.authenticated) return;

        try {
            const profile = await userApiService.syncUser();
            setUserProfile(profile);
            refreshPrivacyPreferences().catch(error => {
                console.error('Failed to refresh privacy preferences:', error);
            });
        } catch (error) {}
    }, [refreshPrivacyPreferences])

    const refreshUserProfile = useCallback(async (): Promise<void> => {
        if (!keycloak.authenticated) return;

        try{
            const profile = await userApiService.getCurrentUser();
            setUserProfile(profile);
        } catch (error) {
            throw new Error('Failed to refresh user profile');
        }
    }, []);

    const updateDisplayName = useCallback(async (displayName: string): Promise<void> => {
        try {
            const updatedProfile = await userApiService.updateDisplayName(displayName);
            setUserProfile(updatedProfile);
        } catch (error) {
            throw new Error('Failed to update display name');
        }
    }, [])

    const initializeAuth = useCallback(async (): Promise<void> => {
        try{
            const authenticated = await initKeycloak();
            setIsAuthenticated(authenticated)

            if (authenticated && keycloak.tokenParsed) {
                setUser(keycloak.tokenParsed);
                await syncUserProfile();
            }

            keycloak.onAuthSuccess = () => {
                setIsAuthenticated(true);
                if (keycloak.tokenParsed) {
                    console.log('User:', keycloak.tokenParsed);
                    setUser(keycloak.tokenParsed);
                }
                syncUserProfile();
            };

            keycloak.onAuthLogout = () => {
                setIsAuthenticated(false);
                setUser(null);
                setUserProfile(null);
            };

            keycloak.onTokenExpired = () => {
                keycloak.updateToken(30).then(refreshed => {
                    if (refreshed) {
                        console.log('Token refreshed');
                    } else {
                        console.log('Token refresh failed');
                    }
                }).catch(() => {
                    keycloak.login();
                });
            }
        } catch (error) {
            console.error('Error initializing Keycloak:', error);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    }, [syncUserProfile]);

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    const login = useCallback(() : void => {
        keycloak.login();
    }, []);

    const logout = useCallback((): void => {
        keycloak.logout();
    }, []);

    const register = useCallback((): void => {
        keycloak.register();
    }, []);

    const hasRole = useCallback((roles: string[]) => {
        if (!keycloak.authenticated || !keycloak.tokenParsed) return false;

        const userRoles = keycloak.tokenParsed.realm_access?.roles || [];
        return roles.some(role => userRoles.includes(role));
    }, []);

    const authContextValues: AuthContextType = {
        isAuthenticated,
        user,
        userProfile,
        privacyPreferences,
        login,
        logout,
        register,
        hasRole,
        loading,
        syncUserProfile,
        refreshUserProfile,
        updateDisplayName,
        refreshPrivacyPreferences,
        updatePrivacyPreferences
    }

    return (
        <AuthContext.Provider value={authContextValues}>
            {children}
        </AuthContext.Provider>
    );
};

export const
    useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};