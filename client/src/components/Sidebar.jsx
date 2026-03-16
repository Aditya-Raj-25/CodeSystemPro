import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Github, Settings } from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Repositories', path: '/repositories', icon: Github },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-sidebar border-r border-border flex flex-col">
            <div className="h-16 flex items-center px-6 border-b border-border">
                <div className="flex items-center gap-2 text-accent-light font-bold text-xl tracking-tight">
                    <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
                        <span className="text-sm">&lt;/&gt;</span>
                    </div>
                    CodeTrackr
                </div>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-600/10 text-blue-500 font-medium'
                                : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                                }`}
                        >
                            <Icon size={18} className={isActive ? 'text-blue-500' : ''} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
