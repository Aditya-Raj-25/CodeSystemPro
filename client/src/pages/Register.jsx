import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const { register, googleLogin } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const apiData = {
                name: formData.name,
                email: formData.email,
                password: formData.password
            };
            await register(apiData);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            toast.error(err.response?.data?.message || 'Registration failed');
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                await googleLogin(tokenResponse.access_token);
                navigate('/');
            } catch (err) {
                toast.error('Google registration failed');
            }
        },
        onError: () => {
            toast.error('Google registration failed');
        },
    });

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10">
                <div className="flex justify-center text-blue-500 font-bold text-3xl mb-2 items-center gap-2">
                    <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white">
                        <span className="text-lg">&lt;/&gt;</span>
                    </div>
                    CodeTrackr
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Create your account</h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl z-10">
                <div className="bg-sidebar py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-border">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-md border border-red-500/20">{error}</div>}

                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-300">Full Name</label>
                                <input name="name" required onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-border bg-background rounded-md text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-300">Email Address</label>
                                <input type="email" name="email" required onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-border bg-background rounded-md text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-300">Password</label>
                                <input type="password" name="password" required onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-border bg-background rounded-md text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            </div>

                            {/* Integrations removed from registration step */}
                        </div>

                        <div className="pt-2">
                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 cursor-pointer">
                                Register
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
                                className="w-full inline-flex justify-center items-center py-2 px-4 border border-border rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors z-20 cursor-pointer"
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

                    <div className="mt-6 text-center text-sm">
                        <span className="text-gray-400">
                            Already have an account? <Link to="/login" className="font-medium text-blue-500 hover:text-blue-400">Log in</Link>
                        </span>
                    </div>
                </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        </div>
    );
};

export default Register;
