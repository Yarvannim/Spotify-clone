export interface PrivacyPreferences {
    userId: string;
    dataProcessingConsent: boolean;
    dataSharingConsent: boolean;
    marketingConsent: boolean;
    consentGivenAt: string;
    preferencesUpdatedAt: string;
}

export interface PrivacyPreferencesUpdateRequest {
    allowMarketingEmails: boolean;
    allowDataProcessing: boolean;
    allowDataSharing: boolean;
}

export interface PrivacyConsentBannerProps {
    onAccept: (preferences: PrivacyPreferencesUpdateRequest) => Promise<void>;
    onCustomize: () => void;
    isOpen: boolean;
}

export interface PrivacySettingsProps {
    preferences: PrivacyPreferences;
    onPreferencesUpdate: (preferences: PrivacyPreferencesUpdateRequest) => Promise<void>;
    isLoading?: boolean;
}