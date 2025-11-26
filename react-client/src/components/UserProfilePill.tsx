import React, {useState} from "react";
import { useAuth } from "../auth/AuthContext.tsx";
import { UserProfilePage } from "./UserProfilePage.tsx";

export const UserProfilePill: React.FC = () => {
    const { user, userProfile, logout } = useAuth();
    const [showProfilePage, setShowProfilePage] = useState(false);

    if (!user || !userProfile) {
        return null;
    }

    if (showProfilePage) {
        return <UserProfilePage/>
    }

    return (
        <div className={"flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200"}>
            <button
                onClick={() => setShowProfilePage(true)}
                className={"flex items-center gap-3 hover:opacity-80 transition duration-200"}>
                <div className={"w-8 h-8 bg-green-600 rounded-full flex items-center justify-center"}>
                    <span className={"text-white text-sm font-medium"}>
                        {user.preferred_username?.[0]?.toUpperCase() || 'U'}
                    </span>
                </div>
                <div className={"flex flex-col items-start"}>
                    <span className={"text-gray-700 text-sm font-medium max-w-32 truncate"}>
                        {userProfile.displayName}
                    </span>
                    {userProfile.isArtist && (
                        <span className={"text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full"}>
                            Artist
                        </span>
                    )}
                </div>
            </button>
            <button onClick={logout}
                    className={"text-gray-400 hover:text-gray-600 transition duration-200 p-1"}
                    title={"Logout"}
            >
                <svg className={"w-5 h-5"} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
                    <path strokeLinecap={"round"} strokeLinejoin={"round"} strokeWidth={2}
                          d={"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"}
                    />
                </svg>
            </button>
        </div>
    );
};