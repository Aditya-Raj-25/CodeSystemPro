import React, { useState, useContext } from 'react';
import { RefreshCw, User, Settings, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const [isSyncing, setIsSyncing] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const handleSyncAll = async () => {
        setIsSyncing(true);
        try {
            // Need the full URL if trailing slash or relative path causes issues, but standard configuration works
            await axios.get('http://localhost:8080/api/sync/sync-all');
            // Assuming we'd want to refresh some global state or window
            window.location.reload();
        } catch (err) {
            console.error('Manual sync failed', err);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <header className="h-16 bg-sidebar border-b border-border flex items-center justify-between px-6 z-10">
            <div>
                <h1 className="text-lg font-bold text-gray-100">CodeTrackr Pro</h1>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={handleSyncAll}
                    disabled={isSyncing}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium text-sm transition-colors"
                >
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                    {isSyncing ? 'Syncing...' : 'Sync All'}
                </button>

                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 border border-border text-gray-300 hover:text-white transition-colors"
                    >
                        {user?.name?.charAt(0).toUpperCase() || <User size={16} />}
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden py-1">
                            <div className="px-4 py-2 border-b border-border">
                                <p className="text-sm font-medium text-white">{user?.name}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-sidebar hover:text-white flex items-center gap-2"
                            >
                                <Settings size={14} /> Settings
                            </button>
                            <button
                                onClick={() => { setDropdownOpen(false); logout(); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-sidebar hover:text-red-300 flex items-center gap-2"
                            >
                                <LogOut size={14} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
