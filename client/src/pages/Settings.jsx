import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { DownloadCloud, Trash2, LogOut, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

const Settings = () => {
    const { user, fetchUser, logout } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        githubUsername: '',
        githubRepo: '',
        githubToken: '',
        leetcodeHandle: '',
        codeforcesHandle: '',
        gfgHandle: '',
        codechefHandle: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                githubUsername: user.githubUsername || '',
                githubRepo: user.githubRepo || '',
                githubToken: '', // Keep empty for security, only update if typed
                leetcodeHandle: user.platformHandles?.leetcode || '',
                codeforcesHandle: user.platformHandles?.codeforces || '',
                gfgHandle: user.platformHandles?.gfg || '',
                codechefHandle: user.platformHandles?.codechef || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await axios.put('http://localhost:8080/api/auth/settings', {
                githubUsername: formData.githubUsername,
                githubRepo: formData.githubRepo,
                githubToken: formData.githubToken || undefined,
                platformHandles: {
                    leetcode: formData.leetcodeHandle,
                    codeforces: formData.codeforcesHandle,
                    gfg: formData.gfgHandle,
                    codechef: formData.codechefHandle
                }
            });
            await fetchUser();
            setMessage({ type: 'success', text: 'Settings updated successfully' });
            toast.success('Settings saved successfully!');
            setFormData(prev => ({ ...prev, githubToken: '' })); // clear token field after save
        } catch (err) {
            console.error('Settings Error:', err);
            setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to update settings' });
            toast.error(err.response?.data?.message || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = '/CodeTrackrExtension.zip';
        link.download = 'CodeTrackrExtension.zip';
        link.click();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Settings</h2>
                <p className="text-sm text-gray-400 mt-1">Manage your GitHub connection and platform handles.</p>
            </div>

            {message.text && (
                <div className={`p-4 rounded-lg text-sm border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-200 mb-4">GitHub Configuration</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                                    <input type="text" name="githubUsername" value={formData.githubUsername} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-sm text-gray-200 focus:ring-accent focus:border-accent" placeholder="octocat" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Repository Name</label>
                                    <input type="text" name="githubRepo" value={formData.githubRepo} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-sm text-gray-200 focus:ring-accent focus:border-accent" placeholder="my-solutions" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Personal Access Token (PAT)</label>
                                    <input type="password" name="githubToken" value={formData.githubToken} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-sm text-gray-200 focus:ring-accent focus:border-accent" placeholder="Leave blank to keep existing token" />
                                    <p className="text-xs text-gray-500 mt-1">Requires 'repo' scope. Token is encrypted securely.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <h3 className="text-lg font-medium text-gray-200 mb-4">Platform Handles</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Codeforces Handle</label>
                                    <input type="text" name="codeforcesHandle" value={formData.codeforcesHandle} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-sm text-gray-200 focus:ring-accent focus:border-accent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">LeetCode Username</label>
                                    <input type="text" name="leetcodeHandle" value={formData.leetcodeHandle} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-sm text-gray-200 focus:ring-accent focus:border-accent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">GeeksforGeeks Handle</label>
                                    <input type="text" name="gfgHandle" value={formData.gfgHandle} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-sm text-gray-200 focus:ring-accent focus:border-accent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">CodeChef Handle</label>
                                    <input type="text" name="codechefHandle" value={formData.codechefHandle} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-sm text-gray-200 focus:ring-accent focus:border-accent" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button type="submit" disabled={loading} className="flex items-center gap-2 bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                                <Save size={16} />
                                {loading ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-medium text-gray-200 mb-4">Browser Extension</h3>
                        <p className="text-sm text-gray-400 mb-4">Download and link the extension to capture real-time submissions.</p>
                        <div className="space-y-3">
                            <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 bg-sidebar border border-border hover:bg-gray-800 text-gray-200 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                                <DownloadCloud size={16} />
                                Download Extension
                            </button>
                            <button
                                onClick={() => {
                                    const token = localStorage.getItem('token');
                                    window.postMessage({ type: 'CODE_TRACKR_SET_TOKEN', token }, '*');
                                    toast.success('Linking request sent to extension!');
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <DownloadCloud size={16} className="rotate-180" />
                                Link Extension Now
                            </button>
                        </div>
                    </div>

                    <div className="bg-card border border-red-500/20 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-medium text-red-400 mb-4">Danger Zone</h3>
                        <div className="space-y-3">
                            <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                                <LogOut size={16} />
                                Logout
                            </button>
                            <button className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-red-500/10 text-gray-500 hover:text-red-400 px-4 py-2 rounded-lg font-medium text-sm transition-colors mt-2">
                                <Trash2 size={16} />
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
