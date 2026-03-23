import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return toast.error('Passwords do not match');
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/resetpassword/${token}`, { password });
            toast.success(res.data.message || 'Password reset successfully');
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset password. The link might be expired.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('/grid.svg')] bg-center">
                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                    <div className="flex justify-center text-green-500 font-bold text-3xl mb-4 items-center gap-2">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-white">Password Reset!</h2>
                    <p className="mt-2 text-gray-400">Your password has been changed successfully.</p>
                    <p className="mt-4 text-sm text-gray-500">Redirecting to login...</p>
                    <div className="mt-6">
                        <Link to="/login" className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Go to Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('/grid.svg')] bg-center">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-blue-500 font-bold text-3xl mb-2 items-center gap-2">
                    <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white">
                        <span className="text-lg">&lt;/&gt;</span>
                    </div>
                    CodeTrackr
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Choose new password</h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    Your new password must be different from previously used passwords.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="bg-sidebar py-8 px-4 shadow-2xl shadow-black/40 sm:rounded-2xl sm:px-10 border border-border">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">New Password</label>
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
                            <label className="block text-sm font-medium text-gray-300">Confirm Password</label>
                            <div className="mt-1">
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>


        </div>
    );
};

export default ResetPassword;
