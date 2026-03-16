import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, googleLogin } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login');
            toast.error(err.response?.data?.message || 'Failed to login');
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            // Note: with useGoogleLogin, standard implicit flow gives access_token. 
            // We need to fetch the user profile using the access token, OR just change our approach
            // to send the access token, or use GoogleLogin component instead to get the JWT.
            try {
                // To get the Google JWT ID token directly with useGoogleLogin, we must use flow: 'implicit' but wait, 
                // useGoogleLogin by default returns access_token.
                // It's easier to just fetch user info on the frontend OR use the explicit @react-oauth/google GoogleLogin button.
                // Let's modify the backend to accept an access token instead of ID token, or change to use auth code flow.
                // Wait, useGoogleLogin doesn't easily expose ID token unless we use the standard `<GoogleLogin />` component.

                // An easier fix: Fetch google user info from googleapis using the access_token, 
                // OR instead of altering backend, let's just fetch it here or send the access_token to our backend.
                // Actually, let's fix backend to verify both, or just change from useGoogleLogin to standard GoogleLogin component.

                // Let's send the access token to the backend and handle it there, it's easier to change the backend.
                await googleLogin(tokenResponse.access_token);
                navigate('/');
            } catch (err) {
                toast.error('Google Login failed');
            }
        },
        onError: () => {
            toast.error('Google Login failed');
        },
    });

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('/grid.svg')] bg-center">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-blue-500 font-bold text-3xl mb-2 items-center gap-2">
                    <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white">
                        <span className="text-lg">&lt;/&gt;</span>
                    </div>
                    CodeTrackr
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Sign in to your account</h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="bg-sidebar py-8 px-4 shadow-2xl shadow-blue-900/10 sm:rounded-2xl sm:px-10 border border-border">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-md border border-red-500/20">{error}</div>}
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Email address</label>
                            <div className="mt-1">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-border bg-background rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <label className="font-medium text-gray-300">Password</label>
                                <Link to="/forgot-password" className="text-blue-500 hover:text-blue-400 font-medium z-20">Forgot Password?</Link>
                            </div>
                            <div className="mt-1">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-border bg-background rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                Sign in
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-sidebar text-gray-400">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() => loginWithGoogle()}
                                className="w-full inline-flex justify-center items-center py-2 px-4 border border-border rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors z-20"
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </button>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-sidebar text-gray-400">
                                    New to CodeTrackr? <Link to="/register" className="font-medium text-blue-500 hover:text-blue-400">Create an account</Link>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative blurred blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        </div>
    );
};

export default Login;
