import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import authConfig from '../config/auth';
import './DashboardPage.css';

interface UserProfile {
    userId: string;
    email: string;
    givenName: string;
    familyName: string;
    bio?: string;
    updatedAt?: string;
}

export function DashboardPage() {
    const { user, signOut, getAccessToken } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getAccessToken();
            if (!token) {
                setError('Not authenticated');
                return;
            }

            const response = await fetch(`${authConfig.apiUrl}/api/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 404) {
                // No profile yet — that's ok
                setProfile(null);
            } else if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            } else {
                const data = await response.json();
                setProfile(data);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load profile';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Baseline AWS</h1>
                <div className="header-actions">
                    <span className="user-email">{user?.username}</span>
                    <button onClick={handleSignOut} className="signout-btn">
                        Sign Out
                    </button>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-card">
                    <h2>Your Profile</h2>

                    {isLoading && (
                        <div className="dashboard-loading">
                            <div className="spinner" />
                            <p>Loading profile…</p>
                        </div>
                    )}

                    {error && (
                        <div className="dashboard-error">
                            <p>{error}</p>
                            <button onClick={fetchProfile} className="retry-btn">
                                Retry
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && !profile && (
                        <div className="no-profile">
                            <p>No profile found. Your profile will be created when you update your settings.</p>
                        </div>
                    )}

                    {!isLoading && !error && profile && (
                        <div className="profile-details">
                            <div className="profile-row">
                                <span className="profile-label">Name</span>
                                <span className="profile-value">
                                    {profile.givenName} {profile.familyName}
                                </span>
                            </div>
                            <div className="profile-row">
                                <span className="profile-label">Email</span>
                                <span className="profile-value">{profile.email}</span>
                            </div>
                            <div className="profile-row">
                                <span className="profile-label">User ID</span>
                                <span className="profile-value mono">{profile.userId}</span>
                            </div>
                            {profile.bio && (
                                <div className="profile-row">
                                    <span className="profile-label">Bio</span>
                                    <span className="profile-value">{profile.bio}</span>
                                </div>
                            )}
                            {profile.updatedAt && (
                                <div className="profile-row">
                                    <span className="profile-label">Last Updated</span>
                                    <span className="profile-value">
                                        {new Date(profile.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default DashboardPage;
