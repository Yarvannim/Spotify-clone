import { keycloak } from "../auth/keycloak.ts";
import type {PrivacyPreferences, PrivacyPreferencesUpdateRequest} from "../types/Privacy.ts";

class PrivacyApiService {
    private async getAuthHeaders(): Promise<HeadersInit>{
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (keycloak.authenticated && keycloak.token){
            headers['Authorization'] = `Bearer ${keycloak.token}`;
        }
        return headers;
    }

    async getPrivacyPreferences(): Promise<PrivacyPreferences> {
        const headers = await this.getAuthHeaders();
        const response = await fetch('/api/users/privacy/preferences', {
            headers
        });

        if (response.status === 404) {
            return this.createDefaultPreferences();
        }

        if (!response.ok) {
            throw new Error('Failed to fetch privacy preferences');
        }
        return await response.json();
    }

    async updatePrivacyPreferences(request: PrivacyPreferencesUpdateRequest): Promise<PrivacyPreferences> {
        const headers = await this.getAuthHeaders();
        const response = await fetch('/api/users/privacy/preferences', {
            method: 'PUT',
            headers,
            body: JSON.stringify(request)
        });
        if (!response.ok) {
            throw new Error('Failed to update privacy preferences');
        }
        return await response.json();
    }

    async withdrawConsent(): Promise<void> {
        const headers = await this.getAuthHeaders();
        const response = await fetch('/api/users/privacy/withdraw-consent', {
            method: 'POST',
            headers
        });
        if (!response.ok) {
            throw new Error('Failed to withdraw consent');
        }
    }

    async exportUserData(): Promise<Blob> {
        const headers = await this.getAuthHeaders();
        const response = await fetch('/api/users/me/export-data', {
            headers
        });
        if (!response.ok) {
            throw new Error('Failed to export user data');
        }
        return await response.blob();
    }

    private async createDefaultPreferences(): Promise<PrivacyPreferences> {
        const headers = await this.getAuthHeaders();
        const defaultPreferences = {
            allowDataProcessing: false,
            allowDataSharing: false,
            allowMarketingEmails: false,
        };

        const response = await fetch('/api/users/privacy/preferences', {
            method: 'PUT',
            headers,
            body: JSON.stringify(defaultPreferences)
        })

        if (!response.ok) {
            throw new Error('Failed to create default privacy preferences');
        }
        return await response.json();
    }
}

export const privacyApiService = new PrivacyApiService();