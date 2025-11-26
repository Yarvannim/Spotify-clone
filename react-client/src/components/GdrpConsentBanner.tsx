import React, { useState, useEffect } from "react";
import type {PrivacyConsentBannerProps, PrivacyPreferencesUpdateRequest} from "../types/Privacy.ts";

export const GdrpConsentBanner: React.FC<PrivacyConsentBannerProps> = ({ isOpen, onAccept, onCustomize }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasConsentChoice = localStorage.getItem('gdpr-consent-choice');
        if (!hasConsentChoice && isOpen) {
            setIsVisible(true);
        }
    }, [isOpen]);

    const handleAcceptAll = () => {
        const preferences: PrivacyPreferencesUpdateRequest = {
            allowDataProcessing: true,
            allowMarketingEmails: true,
            allowDataSharing: true
        };
        onAccept(preferences);
        localStorage.setItem('gdpr-consent-choice', 'accepted');
        setIsVisible(false);
    }

    const handleEssentialOnly = () => {
        const preferences: PrivacyPreferencesUpdateRequest = {
            allowDataProcessing: true,
            allowMarketingEmails: false,
            allowDataSharing: false
        };
        onAccept(preferences);
        localStorage.setItem('gdpr-consent-choice', 'essential');
        setIsVisible(false);
    }

    const handleCustomize = () => {
        onCustomize();
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className={"fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-100 p-4"}>
            <div className={"max-w-7xl max-auto flex flex-col gap-4"}>
                <div className={"flex flex-col sm-flex-row sm:items-center sm:justify-between gap-4"}>
                    <div className={"flex-1"}>
                        <h3 className={"text-lg font-semibold text-gray-900 mb-2"}>
                            Privacy Preferences
                        </h3>
                        <p className={"text-gray-600 text-sm"}>
                            We use cookies and similar technologies to help personalize content,
                            tailor and measure ads, and provide a better experience. By clicking
                            accept, you agree to this use as outlined in our{' '}
                            <a href={"/privacy-policy"} target={"_blank"} rel={"noopener noreferrer"} className={"text-green-600 hover:text-green-800 underline"}>
                                Privacy Policy
                            </a>.
                        </p>
                    </div>
                    <div className={"flex flex-col sm:flex-row gap-2 sm:gap-3"}>
                        <button
                            onClick={handleEssentialOnly}
                            className={"px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-full hover:bg-gray-700 transition duration-200"}>
                            Essential Only
                        </button>
                        <button
                            onClick={handleAcceptAll}
                            className={"px-4 py-2 bg-green-600 text0white text-sm font-medium rounded-full hover:bg-green-700 transition duration-200"}>
                            Accept all
                        </button>
                        <button
                            onClick={handleCustomize}
                            className={"px-4 py-2 bg-transparent text-green-600 text-sm font-medium rounded-full border border-green-600 hover:bg-green-600 hover:text-white transition duration-200"}>
                            Customize
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};