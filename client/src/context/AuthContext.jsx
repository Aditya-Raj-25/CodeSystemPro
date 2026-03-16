import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const syncTokenToExtension = (token) => {
        // Send a message to the extension passing the token.
        // We assume the extension is installed and listening.
        if (window.chrome && window.chrome.runtime) {
            // Note: Since the web app and extension run in different contexts,
            // we need to ask the user to configure the extension ID or use externally_connectable in manifest.
            // Alternatively, a simpler way is to have a content script injected by the extension
            // that listens to window.postMessage from the web app.
            window.postMessage({ type: 'CODE_TRACKR_SET_TOKEN', token: token }, '*');
        }
    };

    // Set default axios header
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // Always sync token to extension on page load (fixes token loss after extension reload)
            syncTokenToExtension(token);
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/auth/me');
            setUser(res.data);
        } catch (err) {
            console.error(err);
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await axios.post('http://localhost:8080/api/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        syncTokenToExtension(res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
    };

    const register = async (userData) => {
        const res = await axios.post('http://localhost:8080/api/auth/register', userData);
        localStorage.setItem('token', res.data.token);
        syncTokenToExtension(res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
    };

    const googleLogin = async (googleToken) => {
        const res = await axios.post('http://localhost:8080/api/auth/google', { token: googleToken });
        localStorage.setItem('token', res.data.token);
        syncTokenToExtension(res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        syncTokenToExtension(null);
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};
