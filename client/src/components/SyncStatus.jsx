import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink, CheckCircle, RefreshCw, XCircle, Clock } from 'lucide-react';
import { API_URL } from '../config';

const SyncStatus = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/sync/submissions`);
                setSubmissions(res.data);
            } catch (err) {
                console.error('Error fetching submissions', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissions();
        // Poll every 30 seconds for updates
        const interval = setInterval(fetchSubmissions, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="text-gray-400 text-sm p-4">Loading sync status...</div>;
    if (submissions.length === 0) return <div className="text-gray-500 text-sm p-4 italic">No submissions synced yet. Start coding!</div>;

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="space-y-3">
            {submissions.slice(0, 5).map((sub) => (
                <div key={sub._id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:bg-sidebar transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700 font-mono text-xs text-gray-400">
                            &lt;/&gt;
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-gray-200 group-hover:text-blue-400 transition-colors">{sub.problemName}</h4>
                                <a href={sub.githubUrl || '#'} target="_blank" rel="noreferrer">
                                    <ExternalLink size={12} className="text-gray-500 hover:text-gray-300 cursor-pointer" />
                                </a>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider text-green-500 bg-green-500/10 border border-green-500/20">
                                    <CheckCircle size={10} />
                                    Synced
                                </span>
                                <span className="text-xs text-gray-500">{getTimeAgo(sub.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SyncStatus;
