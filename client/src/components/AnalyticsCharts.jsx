import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const AnalyticsCharts = ({ type, data }) => {
    if (!data) return null;

    if (type === 'donut') {
        const difficultyData = [
            { name: 'Easy', value: data.difficulties.Easy || 0, color: '#4ade80' },
            { name: 'Medium', value: data.difficulties.Medium || 0, color: '#fbbf24' },
            { name: 'Hard', value: data.difficulties.Hard || 0, color: '#f87171' },
            { name: 'Unknown', value: data.difficulties.Unknown || 0, color: '#9ca3af' }
        ].filter(d => d.value > 0);

        const totalDiff = difficultyData.reduce((acc, curr) => acc + curr.value, 0);

        return (
            <div className="h-64 w-full relative group">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={difficultyData}
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            animationBegin={200}
                            animationDuration={800}
                        >
                            {difficultyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#e2e8f0' }}
                            itemStyle={{ color: '#e2e8f0' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-transform group-hover:scale-110">
                    <span className="text-3xl font-bold text-white drop-shadow-lg">{data.total}</span>
                    <span className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">Total</span>
                </div>
                <div className="flex justify-between mt-4">
                    {difficultyData.slice(0, 3).map((d) => (
                        <div key={d.name} className="text-center bg-background rounded-lg p-2 border border-border flex-1 mx-1">
                            <div className="text-xs mb-1 truncate" style={{ color: d.color }}>{d.name}</div>
                            <div className="font-bold text-white text-sm">{Math.round((d.value / totalDiff) * 100)}%</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'bar') {
        const languageData = Object.entries(data.languages || {})
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // top 5

        return (
            <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={languageData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.5} />
                        <XAxis type="number" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                        <YAxis dataKey="name" type="category" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} width={60} />
                        <Tooltip
                            cursor={{ fill: '#1e293b' }}
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem' }}
                            itemStyle={{ color: '#60A5FA' }}
                        />
                        <Bar
                            dataKey="count"
                            fill="#3B82F6"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                            animationDuration={1000}
                            className="hover:opacity-90 transition-opacity"
                        >
                            {languageData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#60a5fa'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    }

    return null;
};

export default AnalyticsCharts;
