import React from 'react';
import { Trophy, Code2, BookOpen, Coffee } from 'lucide-react';

const PlatformCards = ({ data }) => {
    const defaultData = { leetcode: 0, codeforces: 0, gfg: 0, codechef: 0 };
    const stats = data || defaultData;

    const platforms = [
        {
            name: 'LeetCode',
            icon: Code2,
            problems: stats.leetcode,
            color: 'text-yellow-500',
            bgClass: 'bg-yellow-500/10'
        },
        {
            name: 'Codeforces',
            icon: Trophy,
            problems: stats.codeforces,
            color: 'text-blue-500',
            bgClass: 'bg-blue-500/10'
        },
        {
            name: 'GFG',
            icon: BookOpen,
            problems: stats.gfg,
            color: 'text-green-500',
            bgClass: 'bg-green-500/10'
        },
        {
            name: 'CodeChef',
            icon: Coffee,
            problems: stats.codechef,
            color: 'text-orange-500',
            bgClass: 'bg-orange-500/10'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platforms.map((platform) => {
                const Icon = platform.icon;
                return (
                    <div key={platform.name} className="bg-sidebar border border-border rounded-xl p-5 hover:border-gray-600 transition-colors relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={`w-10 h-10 rounded-lg ${platform.bgClass} flex items-center justify-center`}>
                                <Icon size={20} className={platform.color} />
                            </div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{platform.name}</span>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-white">{platform.problems}</h3>
                                <span className="text-sm text-gray-400">problems</span>
                            </div>
                            <div className="mt-2 text-sm text-gray-400 flex items-center gap-1.5">
                                <span>Total Synced</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PlatformCards;
