import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Mail, Phone, Eye, EyeOff, ArrowLeft } from 'lucide-react';

// Supabase client
const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

const AuthPage = ({ onUserAuth, onPageChange }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [session, setSession] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        fullName: ''
    });

    // 🔥 Fix: Handle OAuth redirect + normal session
    useEffect(() => {
        // Listener for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setSession(session);
                console.log("Auth Event:", event, session); // 👀 Debug
                if (event === "SIGNED_IN" && session) {
                    handleUserAuthenticated(session);
                }
            }
        );

        // Check existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("Initial Session:", session); // 👀 Debug
            if (session) {
                setSession(session);
                handleUserAuthenticated(session);
            }
        });

        // Handle OAuth redirect (Google Sign-In etc.)
        const hash = window.location.hash;
        if (hash.includes("access_token")) {
            console.log("OAuth redirect detected, restoring session..."); // 👀 Debug
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    setSession(session);
                    handleUserAuthenticated(session);
                }
            });

            // Clean URL after restoring session
            window.history.replaceState({}, document.title, "/web/");
        }

        return () => subscription.unsubscribe();
    }, []);

    const handleUserAuthenticated = (session) => {
        onUserAuth({
            id: session.user.id,
            email: session.user.email,
            phone: session.user.user_metadata?.phone || session.user.phone,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            provider: session.user.app_metadata?.provider
        });
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const validateForm = () => {
        if (!formData.email || !formData.password) {
            setError('Email and password are required');
            return false;
        }

        if (!isLogin) {
            if (!formData.fullName) {
                setError('Full name is required for signup');
                return false;
            }

            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return false;
            }

            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters');
                return false;
            }
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                // Login
                const { error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                });

                if (error) throw error;
            } else {
                // Signup with custom metadata
                const { data, error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.fullName,
                            phone: formData.phone,
                        }
                    }
                });

                if (error) throw error;

                if (data.user && !data.user.email_confirmed_at) {
                    setError('Please check your email and click the confirmation link to complete signup!');
                }
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Google Sign In
    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: "https://ashutoshrai725.github.io/web/"
                }
            });

            if (error) throw error;
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-manu-light to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">

                {/* Back Button */}
                <button
                    onClick={() => onPageChange('landing')}
                    className="flex items-center text-manu-dark hover:text-manu-green transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Home
                </button>

                {/* Header */}
                <div className="text-center">
                    <img
                        src="/logos/manudocs_logo.jpg"
                        alt="MANUDOCS"
                        className="h-12 w-auto mx-auto mb-4"
                    />
                    <h2 className="text-3xl font-bold text-manu-dark">
                        {isLogin ? 'Welcome back!' : 'Create your account'}
                    </h2>
                    <p className="mt-2 text-gray-600">
                        {isLogin
                            ? 'Sign in to access your export documentation dashboard'
                            : 'Join MANUDOCS and streamline your export processes'
                        }
                    </p>
                </div>



                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                    </div>
                </div>

                {/* Email Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">

                        {/* Full Name - Signup only */}
                        {!isLogin && (
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                                    Full Name *
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    required={!isLogin}
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-manu-green focus:border-manu-green"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address *
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-manu-green focus:border-manu-green"
                                    placeholder="Enter your email"
                                />
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            </div>
                        </div>

                        {/* Phone - Signup only */}
                        {!isLogin && (
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                    Phone Number (Optional)
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-manu-green focus:border-manu-green"
                                        placeholder="+91 98765 43210"
                                    />
                                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    We'll store this for document processing notifications
                                </p>
                            </div>
                        )}

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password *
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-manu-green focus:border-manu-green"
                                    placeholder={isLogin ? "Enter your password" : "Create a password (min 6 chars)"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password - Signup only */}
                        {!isLogin && (
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirm Password *
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-manu-green focus:border-manu-green"
                                    placeholder="Confirm your password"
                                />
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-manu-green hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-manu-green disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            isLogin ? 'Sign In' : 'Create Account'
                        )}
                    </button>

                    {/* Toggle Login/Signup */}
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                                setFormData({
                                    email: '',
                                    phone: '',
                                    password: '',
                                    confirmPassword: '',
                                    fullName: ''
                                });
                            }}
                            className="text-manu-green hover:text-green-600 text-sm font-medium"
                        >
                            {isLogin
                                ? "Don't have an account? Sign up"
                                : "Already have an account? Sign in"
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthPage;
