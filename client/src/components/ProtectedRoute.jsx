import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-white">Loading...</div>;

    return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
