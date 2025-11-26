import { useState, useCallback} from "react";
import {SearchBar} from "./components/SearchBar.tsx";
import {SongStream} from "./components/SongStream.tsx";
import {useAuth} from "./auth/AuthContext.tsx";
import {UserProfilePill} from "./components/UserProfilePill.tsx";
import {LoginButton} from "./components/LoginButton.tsx";
import {GdrpConsentBanner} from "./components/GdrpConsentBanner.tsx";

function App() {
    const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
    const { isAuthenticated, privacyPreferences, updatePrivacyPreferences } = useAuth();

    const handleSongSelect = useCallback((songId: string) => {
        setSelectedSongId(songId);
    }, [])

    const showGdprBanner = isAuthenticated && privacyPreferences && !privacyPreferences.dataProcessingConsent

    return (
        <div className={"min-h-screen bg-gradient-to-br from-green-50 to-blue-50"}>
            <div className={"container mx-auto px-4 py-8"}>
                <header className={"text-center mb-12"}>
                    <h1 className={"text-5xl font-bold text-green-600 mb-2"}>
                        Music Streaming App
                    </h1>
                    <p className={"text-gray-600 text-lg"}>
                        Discover and listen to your favorite songs.
                    </p>
                    <div className={"flex items-center gap-4 text-center justify-center"}>
                        {isAuthenticated ? <UserProfilePill/> : <LoginButton/>}
                    </div>
                </header>

                <main className={"space-y-12"}>
                    <section className={"flex justify-center"}>
                        <SearchBar onSongSelect={handleSongSelect}/>
                    </section>

                    <section className={"flex justify-center"}>
                        {selectedSongId && (
                                <SongStream songId={selectedSongId}/>
                        )}
                    </section>
                </main>

                <footer className={"text-center mt-12"}>
                    <p className={"text-gray-600"}>
                        &copy; 2025 Music Streaming App. All rights reserved.
                    </p>
                </footer>
            </div>

            {showGdprBanner && (
                <GdrpConsentBanner
                    onAccept={updatePrivacyPreferences}
                    onCustomize={() => {
                        const profilePill = document.querySelector('[user-profile-pill]');
                        if (profilePill) {
                            (profilePill as HTMLElement).click();
                        }
                    }}
                    isOpen={showGdprBanner}
                />
            )}
        </div>
    )
}

export default App;