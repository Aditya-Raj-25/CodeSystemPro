import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import PlatformCards from '../components/PlatformCards';
import AnalyticsCharts from '../components/AnalyticsCharts';
import SyncStatus from '../components/SyncStatus';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/sync/stats');
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch stats', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleSyncAll = async () => {
        setIsSyncing(true);
        try {
            await axios.get('http://localhost:8080/api/sync/sync-all');
            await fetchStats(); // Refresh stats after sync
        } catch (err) {
            console.error('Manual sync failed', err);
        } finally {
            setIsSyncing(false);
        }
    };

    if (loading) return <div className="text-gray-400">Loading dashboard...</div>;

    const hasSubmissions = stats && stats.total > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white">Platform Breakdown</h2>
                    {hasSubmissions && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Live Data
                        </div>
                    )}
                </div>
            </div>

            <PlatformCards data={stats?.platforms} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 border border-border bg-sidebar rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Difficulty Distribution</h3>
                    </div>
                    {hasSubmissions ? <AnalyticsCharts type="donut" data={stats} /> : <p className="text-sm text-gray-500 text-center mt-10">No submissions yet.</p>}
                </div>

                <div className="lg:col-span-2 border border-border bg-sidebar rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Language Usage</h3>
                    </div>
                    {hasSubmissions ? <AnalyticsCharts type="bar" data={stats} /> : <p className="text-sm text-gray-500 text-center mt-10">No submissions yet.</p>}
                </div>
            </div>

            <div className="border border-border bg-sidebar rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white">Repository Sync Status</h3>
                        <p className="text-xs text-gray-400 mt-1">Manage connections to your GitHub repositories.</p>
                    </div>
                    <Link to="/repositories" className="text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors">
                        View All Logs →
                    </Link>
                </div>
                <SyncStatus />
            </div>

        </div>
    );
};

export default Dashboard;
