import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink, Filter } from 'lucide-react';

const Repositories = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [platformFilter, setPlatformFilter] = useState('All');

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/sync/submissions');
                setSubmissions(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmissions();
    }, []);

    const filteredSubs = platformFilter === 'All'
        ? submissions
        : submissions.filter(s => s.platform.toLowerCase() === platformFilter.toLowerCase());

    const platforms = ['All', 'LeetCode', 'Codeforces', 'GFG', 'CodeChef'];

    if (loading) return <div className="text-gray-400">Loading submissions...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Synchronized Repositories</h2>
                    <p className="text-sm text-gray-400 mt-1">View your successfully synced algorithm solutions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-400" />
                    <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value)}
                        className="bg-card border border-border text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                    >
                        {platforms.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-400 uppercase bg-sidebar border-b border-border">
                            <tr>
                                <th className="px-6 py-3">Problem</th>
                                <th className="px-6 py-3">Platform</th>
                                <th className="px-6 py-3">Language</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3 text-right">GitHub Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No submissions found for this platform.
                                    </td>
                                </tr>
                            ) : filteredSubs.map((sub) => (
                                <tr key={sub._id} className="border-b border-border bg-card hover:bg-sidebar transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-200">
                                        {sub.problemName}
                                    </td>
                                    <td className="px-6 py-4 capitalize">
                                        {sub.platform}
                                    </td>
                                    <td className="px-6 py-4">
                                        {sub.language}
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(sub.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {sub.githubUrl ? (
                                            <a href={sub.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-400 hover:text-blue-300">
                                                View <ExternalLink size={14} className="ml-1" />
                                            </a>
                                        ) : (
                                            <div className="flex flex-col items-end">
                                                <span className="text-gray-500">Pending</span>
                                                {sub.syncError && (
                                                    <span className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={sub.syncError}>
                                                        {sub.syncError}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Repositories;
