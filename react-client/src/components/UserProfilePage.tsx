import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext.tsx";
import { privacyApiService } from "../services/PrivacyApi.ts";
import {PrivacySettings} from "./PrivacySettings.tsx";

export const UserProfilePage: React.FC = () => {
    const { user, userProfile, updateDisplayName, privacyPreferences, updatePrivacyPreferences } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'privacy'>('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState(userProfile?.displayName || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [privacyLoading, setPrivacyLoading] = useState(false);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    }

    const handleSaveDisplayName = async () => {
        if (!newDisplayName.trim() || newDisplayName === userProfile?.displayName) {
            setIsEditing(false);
            return;
        }

        setIsUpdating(true);
        try {
            await updateDisplayName(newDisplayName);
            setIsEditing(false);
            showMessage('success', 'Display name updated successfully');
        } catch (error) {
            showMessage('error', 'Failed to update display name');
        } finally {
            setIsUpdating(false);
        }
    }

    const handleCancelEdit = () => {
        setNewDisplayName(userProfile?.displayName || '');
        setIsEditing(false);
    }

    const handleUpdatePrivacyPreferences = async (preferences: any) => {
        setPrivacyLoading(true);
        try {
            await updatePrivacyPreferences(preferences);
            showMessage('success', 'Privacy preferences updated successfully');
        } catch (error) {
            showMessage('error', 'Failed to update privacy preferences');
            throw error;
        } finally {
            setPrivacyLoading(false);
        }
    };

    const handleExportData = async () => {
        try {
            const blob = await privacyApiService.exportUserData();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showMessage('success', 'Data exported successfully');
        } catch (error) {
            showMessage('error', 'Failed to export data');
        }
    };

    const handleWithdrawConsent = async () => {
        if (window.confirm('Are you sure you want to withdraw your consent?')) {
            try {
                await privacyApiService.withdrawConsent();
                showMessage('success', 'Consent withdrawn successfully');
            } catch (error) {
                showMessage('error', 'Failed to withdraw consent');
            }
        }
    }

    if (!user || !userProfile || !privacyPreferences){
        return (
            <div className={"min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center"}>
                <div className={"animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"}>

                </div>
            </div>
        )
    }

    return (
        <div className={"min-h-screen bg-gradient-to-br from-green-50 to-blue-50"}>
            <div className={"container mx-auto px-4 py-8"}>
                <header className={"text-center mb-8"}>
                    <button
                        onClick={() => window.history.back()}
                        className={"flex items-center gap-2 text-green-600 hover:text-green-800 transition duration-200 self-start"}
                    >
                        <svg className={"w-5 h-5"} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
                            <path strokeLinecap={"round"} strokeLinejoin={"round"} strokeWidth={2} d={"M10 19l-7-7m0 0l7-7m-7 7h18"}/>
                        </svg>
                        Back to App
                    </button>
                    <div className={"flex items-center justify-center gap-4 mb-4"}>
                        <div className={"w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold"}>
                            {user.preferred_username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className={"text-left"}>
                            <h1 className={"text-3xl font-bold text-gray-800"}>{userProfile.displayName}</h1>
                            <p className={"text-gray-600"}>@{userProfile.username}</p>
                        </div>
                    </div>
                </header>
                {message && (
                    <div className={`max-w-2xl mx-autop mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                )}
                <div className={"max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden"}>
                    <div className={"border-b border-gray-200"}>
                        <nav className={"flex -mb-px"}>
                            <button className={`flex-1 py-4 px-6 text-center font-medium text-sm ${activeTab === 'profile' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveTab('profile')}>
                                Profile
                            </button>
                            <button className={`flex-1 py-4 px-6 text-center font-medium text-sm ${activeTab === 'privacy' ? 'text-green-600 border-b-2 border-b-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveTab('privacy')}>
                                Privacy settings
                            </button>
                        </nav>
                    </div>
                    <div className={"p-6"}>
                        {activeTab === 'profile' && (
                            <div className={"space-y-6"}>
                                <div>
                                    <h2 className={"text-2xl font-bold text-green-800 mb-2"}>Profile information</h2>
                                    <p className={"text-gray-600"}>Manage your profile details and preferences</p>
                                </div>
                                <div className={"grid grid-cols-1 gap-6"}>
                                    <div className={"space-y-4"}>
                                        <div>
                                            <label className={"block text-sm font-medium text-gray-700 mb-1"}>
                                                User ID
                                            </label>
                                            <p className={"text-sm text-gray-900 bg-gray-50 rounded"}>
                                                {userProfile.userId}
                                            </p>
                                        </div>
                                        <div>
                                            <label className={"block text-sm font-medium text-gray-700 mb-1"}>
                                                Username
                                            </label>
                                            <p className={"text-sm text-gray-900 bg-gray-50"}>
                                                {userProfile.username}
                                            </p>
                                        </div>
                                        <div>
                                            <label className={"block text-sm font-medium text-gray-700 mb-1"}>
                                                Display name
                                            </label>
                                            {isEditing ? (
                                                    <div className={"flex items-center gap-2"}>
                                                        <input type={"text"} value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)}
                                                               className={"flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"}
                                                               disabled={isUpdating}
                                                               maxLength={50}
                                                        />
                                                        <button onClick={handleSaveDisplayName} disabled={isUpdating}
                                                                className={"bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 disabled:opacity-50"}>
                                                            {isUpdating ? 'Saving...' : 'Save'}
                                                        </button>
                                                        <button onClick={handleCancelEdit} disabled={isUpdating}
                                                                className={"text-gray-600 hover:text-gray-800 disabled:opacity-50"}>
                                                                Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className={"flex items-center gap-2"}>
                                                        <p className={"text-sm text-gray-900 bg-gray-50 p-2 rounded flex-1"}>
                                                            {userProfile.displayName}
                                                        </p>
                                                        <button onClick={() => setIsEditing(true)}
                                                                className={"text-green-600 hover:text-green-800 transition duration-200 p-2"}
                                                                title={"Edit display name"}>
                                                                <svg className={"w-4 h-4"} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
                                                                    <path strokeLinecap={"round"} strokeLinejoin={"round"} strokeWidth={2} d={"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"}/>
                                                                </svg>
                                                        </button>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>

                                <div className={"space-y-4"}>
                                    <div>
                                        <label className={"block text-sm font-medium text-gray-700 mb-1"}>
                                            Account Type
                                        </label>
                                        <div className={"flex items-center gap-2"}>
                                            <p className={"text-sm text-gray-900 w-full text-center"}>
                                                {userProfile.isArtist ? 'Artist account' : 'Regular account'}
                                            </p>
                                            {userProfile.isArtist && (
                                                <span className={"bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"}>
                                                    Artist
                                                </span>
                                                )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className={"block text-sm font-medium text-gray-700 mb-1"}>
                                            Member since
                                        </label>
                                        <p className={"text-sm text-gray-900"}>
                                            {new Date(userProfile.createdAt).toLocaleDateString('nl-nl', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    <div>
                                        <label className={"block text-sm font-medium text-gray-700 mb-1"}>
                                            Data processing consent
                                        </label>
                                        <div className={"flex items-center gap-2 w-full text-center justify-center"}>
                                            <div className={`w-3 h-3 rounded-full ${privacyPreferences.dataProcessingConsent ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <p className={"text-sm text-gray-900"}>
                                                {privacyPreferences.dataSharingConsent ? 'Active' : 'Not granted'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={"p-6"}>
                        {activeTab === 'privacy' && (
                            privacyLoading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                                </div>
                            ) : privacyPreferences ? (
                                <PrivacySettings
                                    preferences={privacyPreferences}
                                    onUpdate={handleUpdatePrivacyPreferences}
                                    onExportData={handleExportData}
                                    onWithdrawConsent={handleWithdrawConsent}
                                    isLoading={privacyLoading}
                                />
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-600">Unable to load privacy preferences</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};