import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { AuthContext } from '../context/AuthContext';

const Layout = () => {
    const { user } = useContext(AuthContext);

    if (!user) return null;

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
