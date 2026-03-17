import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/forgotpassword`, { email });
            toast.success(res.data.message || 'Reset link sent to your email');
            setEmail('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('/grid.svg')] bg-center">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-blue-500 font-bold text-3xl mb-2 items-center gap-2">
                    <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white">
                        <span className="text-lg">&lt;/&gt;</span>
                    </div>
                    CodeTrackr
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Reset your password</h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="bg-sidebar py-8 px-4 shadow-2xl shadow-blue-900/10 sm:rounded-2xl sm:px-10 border border-border">
                    <form className="space-y-6" onSubmit={handleSubmit}>
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
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'bg-blue-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-sidebar text-gray-400">
                                    Remember your password? <Link to="/login" className="font-medium text-blue-500 hover:text-blue-400">Log in</Link>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        </div>
    );
};

export default ForgotPassword;
