import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './LoginPage.css';

type AuthView = 'signIn' | 'signUp' | 'confirm';

export function LoginPage() {
    const navigate = useNavigate();
    const { signIn, signUp, confirmSignUp, isLoading, error, clearError } = useAuth();

    const [view, setView] = useState<AuthView>('signIn');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [givenName, setGivenName] = useState('');
    const [familyName, setFamilyName] = useState('');
    const [confirmCode, setConfirmCode] = useState('');
    const [localError, setLocalError] = useState('');

    const switchView = (newView: AuthView) => {
        setView(newView);
        clearError();
        setLocalError('');
    };

    const handleSignIn = async (e: FormEvent) => {
        e.preventDefault();
        setLocalError('');
        try {
            await signIn(email, password);
            navigate('/dashboard', { replace: true });
        } catch {
            // error is set in the hook
        }
    };

    const handleSignUp = async (e: FormEvent) => {
        e.preventDefault();
        setLocalError('');
        if (password.length < 12) {
            setLocalError('Password must be at least 12 characters');
            return;
        }
        try {
            const result = await signUp(email, password, givenName, familyName);
            if (!result.isConfirmed) {
                switchView('confirm');
            }
        } catch {
            // error is set in the hook
        }
    };

    const handleConfirm = async (e: FormEvent) => {
        e.preventDefault();
        setLocalError('');
        try {
            await confirmSignUp(email, confirmCode);
            switchView('signIn');
        } catch {
            // error is set in the hook
        }
    };

    const displayError = error || localError;

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Baseline AWS</h1>
                    <p className="auth-subtitle">
                        {view === 'signIn' && 'Sign in to your account'}
                        {view === 'signUp' && 'Create your account'}
                        {view === 'confirm' && 'Verify your email'}
                    </p>
                </div>

                {displayError && (
                    <div className="auth-error">
                        <span>{displayError}</span>
                    </div>
                )}

                {/* ---- Sign In ---- */}
                {view === 'signIn' && (
                    <form onSubmit={handleSignIn} className="auth-form">
                        <div className="form-field">
                            <label htmlFor="signin-email">Email</label>
                            <input
                                id="signin-email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="signin-password">Password</label>
                            <input
                                id="signin-password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                placeholder="••••••••••••"
                            />
                        </div>
                        <button type="submit" className="auth-btn" disabled={isLoading}>
                            {isLoading ? 'Signing in…' : 'Sign In'}
                        </button>
                        <p className="auth-switch">
                            Don't have an account?{' '}
                            <button type="button" onClick={() => switchView('signUp')}>
                                Sign Up
                            </button>
                        </p>
                    </form>
                )}

                {/* ---- Sign Up ---- */}
                {view === 'signUp' && (
                    <form onSubmit={handleSignUp} className="auth-form">
                        <div className="form-row">
                            <div className="form-field">
                                <label htmlFor="signup-given">First Name</label>
                                <input
                                    id="signup-given"
                                    type="text"
                                    value={givenName}
                                    onChange={e => setGivenName(e.target.value)}
                                    required
                                    autoComplete="given-name"
                                    placeholder="Jane"
                                />
                            </div>
                            <div className="form-field">
                                <label htmlFor="signup-family">Last Name</label>
                                <input
                                    id="signup-family"
                                    type="text"
                                    value={familyName}
                                    onChange={e => setFamilyName(e.target.value)}
                                    required
                                    autoComplete="family-name"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>
                        <div className="form-field">
                            <label htmlFor="signup-email">Email</label>
                            <input
                                id="signup-email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="signup-password">Password</label>
                            <input
                                id="signup-password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={12}
                                autoComplete="new-password"
                                placeholder="12+ chars, mixed case, digits, symbols"
                            />
                        </div>
                        <button type="submit" className="auth-btn" disabled={isLoading}>
                            {isLoading ? 'Creating account…' : 'Create Account'}
                        </button>
                        <p className="auth-switch">
                            Already have an account?{' '}
                            <button type="button" onClick={() => switchView('signIn')}>
                                Sign In
                            </button>
                        </p>
                    </form>
                )}

                {/* ---- Confirm ---- */}
                {view === 'confirm' && (
                    <form onSubmit={handleConfirm} className="auth-form">
                        <p className="confirm-info">
                            We sent a verification code to <strong>{email}</strong>
                        </p>
                        <div className="form-field">
                            <label htmlFor="confirm-code">Verification Code</label>
                            <input
                                id="confirm-code"
                                type="text"
                                value={confirmCode}
                                onChange={e => setConfirmCode(e.target.value)}
                                required
                                autoComplete="one-time-code"
                                placeholder="123456"
                                inputMode="numeric"
                                pattern="[0-9]*"
                            />
                        </div>
                        <button type="submit" className="auth-btn" disabled={isLoading}>
                            {isLoading ? 'Verifying…' : 'Verify Email'}
                        </button>
                        <p className="auth-switch">
                            <button type="button" onClick={() => switchView('signIn')}>
                                Back to Sign In
                            </button>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}

export default LoginPage;
