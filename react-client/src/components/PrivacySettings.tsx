import React, { useState } from "react";
import type {PrivacyPreferences, PrivacyPreferencesUpdateRequest} from "../types/Privacy.ts";

interface PrivacySettingsProps {
    preferences: PrivacyPreferences;
    onUpdate: (preferences: PrivacyPreferencesUpdateRequest) => void;
    onExportData: () => void;
    onWithdrawConsent: () => void;
    isLoading?: boolean;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({preferences, onUpdate, onExportData, onWithdrawConsent, isLoading = false }) => {
    const [localPreferences, setLocalPreferences] = useState<PrivacyPreferencesUpdateRequest>({
        allowDataProcessing: preferences.dataProcessingConsent,
        allowDataSharing: preferences.dataSharingConsent,
        allowMarketingEmails: preferences.marketingConsent,
    })

    const [isExporting, setIsExporting] = useState(false);
    const [isWithdrawingConsent, setIsWithdrawingConsent] = useState(false);

    const handleToggle = (key: keyof PrivacyPreferencesUpdateRequest) => {
        setLocalPreferences(prev => ({ ...prev, [key]: !prev[key] }));
        console.log(preferences)
    }

    const handleSave = async () => {
        try {
            onUpdate(localPreferences);
        } catch (error) {
            throw error;
        }
    };

    const handleExportData = async () => {
        try {
            setIsExporting(true);
            await onExportData();
        } catch (error) {
            throw error;
        } finally {
            setIsExporting(false);
        }
    };

    const handleWithdrawConsent = async () => {
        if (window.confirm('Are you sure you want to withdraw your consent?')) {
            try {
                setIsWithdrawingConsent(true);
                await onWithdrawConsent();
                setLocalPreferences(prevState => ({
                    ...prevState,
                    allowDataProcessing: false,
                    allowDataSharing: false,
                    allowMarketingEmails: false,
                }));
            } catch (error) {
                throw error;
            } finally {
                setIsWithdrawingConsent(false);
            }
        }
    }

    const hasUnsavedChanged = JSON.stringify(localPreferences) !== JSON.stringify({
        allowDataProcessing: preferences.dataProcessingConsent,
        allowDataSharing: preferences.dataSharingConsent,
        allowMarketingEmails: preferences.marketingConsent,
    });

    return (
        <div className={"max-w-4xl mx-auto space-y-6"}>
            <div className={"text-center mb-8"}>
                <h2 className={"text-3xl font-bold text-gray-900 mb-2"}>Privacy settings</h2>
                <p className={"text-gray-600 text-lg"}>
                    Manage your data processing preferences and privacy settings.
                </p>
            </div>
            <div className={"bg-white rounded-xl shadow-sm border border-gray-200 p-6"}>
                <h3 className={"text-xl font-semibold text-gray-900 mb-4"}>Data processing consent</h3>
                <div className={"flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0"}>
                    <div className={"flex-1 mr-4"}>
                        <label htmlFor={"data-processing"} className={"block text-sm font-medium text-gray-900 mb-1"}>
                            Essential data processing
                        </label>
                        <p className={"text-sm text-gray-600"}>
                            Required for the application to function, this includes authentication, basic user data and core features.
                        </p>
                    </div>
                    <div className={"flex items-center"}>
                        <input
                            id={"data-processing"}
                            type={"checkbox"}
                            checked={localPreferences.allowDataProcessing}
                            onChange={() => handleToggle('allowDataProcessing')}
                            disabled={isLoading}
                            className={"h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"}/>
                    </div>
                </div>
            </div>
            <div className={"bg-white rounded-xl shadow-sm border border-gray-200 p-6"}>
                <h3 className={"text-xl font-semibold text-gray-900 mb-4"}>
                    Communication preferences
                </h3>
                <div className={"flex items-center justify-between py-4 border-b border-gray-100"}>
                    <div className={"flex-1 mr-4"}>
                        <label htmlFor={"marketing-emails"} className={"block text-sm font-medium text-gray-900 mb-1"}>
                            Marketing emails
                        </label>
                        <p className={"text-sm text-gray-600"}>
                            Receive promotional emails, new feature announcements and special offers.
                        </p>
                    </div>
                    <div className={"flex items-center"}>
                        <input
                            id={"marketing-emails"}
                            type={"checkbox"}
                            checked={localPreferences.allowMarketingEmails}
                            onChange={() => handleToggle('allowMarketingEmails')}
                            disabled={isLoading || !preferences.dataProcessingConsent}
                            className={"h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"}
                        />
                    </div>
                </div>
                <div className={"flex items-center justify-between py-4"}>
                    <div className={"flex-1 mr-4"}>
                        <label htmlFor={"email-notifications"} className={"block text-sm font-medium text-gray-900 mb-1"}>
                            Email notifications
                        </label>
                        <p className={"text-sm text-gray-600"}>
                            Important updates and notifications about your account.
                        </p>
                    </div>
                    <div className={"flex items-center"}>
                        <input
                            id={"email-notifications"}
                            type={"checkbox"}
                            checked={localPreferences.allowMarketingEmails}
                            onChange={() => handleToggle('allowMarketingEmails')}
                            disabled={isLoading || !preferences.dataProcessingConsent}
                            className={"h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"}
                        />
                    </div>
                </div>
            </div>
            <div className={"bg-white rounded-xl shadow-sm border border-gray-200 p-6"}>
                <h3 className={"text-xl font-semibold text-gray-900 mb-4"}>
                    Data sharing preferences
                </h3>
                <div className="flex items-center justify-between py-4">
                    <div className="flex-1 mr-4">
                        <label htmlFor="data-sharing" className="block text-sm font-medium text-gray-900 mb-1">
                            Data Sharing with Partners
                        </label>
                        <p className="text-sm text-gray-600">
                            Allow sharing of anonymized data with trusted partners for analytics and improvement.
                        </p>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="data-sharing"
                            type="checkbox"
                            checked={localPreferences.allowDataSharing}
                            onChange={() => handleToggle('allowDataSharing')}
                            disabled={isLoading || !localPreferences.allowDataSharing}
                            className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col space-y-4">
                    <button
                        onClick={handleSave}
                        disabled={!hasUnsavedChanged || isLoading}
                        className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-full font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                    >
                        {isLoading ? 'Saving...' : 'Save Preferences'}
                    </button>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleExportData}
                            disabled={isExporting}
                            className="flex-1 bg-transparent text-green-600 px-6 py-3 rounded-full font-medium border border-green-600 hover:bg-green-600 hover:text-white disabled:opacity-50 transition duration-200"
                        >
                            {isExporting ? 'Exporting...' : 'Export My Data'}
                        </button>

                        <button
                            onClick={handleWithdrawConsent}
                            disabled={isWithdrawingConsent || isLoading}
                            className="flex-1 bg-red-600 text-white px-6 py-3 rounded-full font-medium hover:bg-red-700 disabled:opacity-50 transition duration-200"
                        >
                            {isWithdrawingConsent ? 'Processing...' : 'Withdraw All Consent'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center py-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                    Consent given: {new Date(preferences.consentGivenAt).toLocaleDateString()} •
                    Last updated: {new Date(preferences.preferencesUpdatedAt).toLocaleDateString()} •
                </p>
                <a
                    href="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                    View full privacy policy
                </a>
            </div>
        </div>
    )
}