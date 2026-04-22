// CODEMAP: FRONTEND_PAGE_LOGIN
// WHAT_THIS_IS: This page renders the Login screen in the frontend.
// WHERE_CONNECTED:
// - Route mapping is defined in client/src/routes/AppRoutes.jsx.
// - This page is displayed inside client/src/components/layout/MainLayout.jsx for normal app routes.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: client/src/pages/Login.jsx
// - Search text: const Login
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toast from '../components/ui/Toast';
import { FaEye, FaEyeSlash, FaUtensils, FaCheckCircle, FaCalendarAlt, FaTruck } from 'react-icons/fa';

// Simple: This shows the login section.
const Login = () => {
  const { login, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);

  // Simple: This creates the retry message.
  const buildRetryMessage = (result, fallbackMessage) => {
    if (result?.retryAfterSeconds) {
      return `${fallbackMessage} Try again in ${result.retryAfterSeconds} seconds.`;
    }
    return fallbackMessage;
  };

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    if (error) {
      setShowToast(true);
    }
  }, [error]);

  useEffect(() => {
    if (location.state?.showVerifyHint) {
      setVerificationEmail((location.state?.email || '').trim().toLowerCase());
      setNotice(location.state?.registrationMessage || 'Please verify your email before logging in.');
    }
  }, [location.state]);

  useEffect(() => {
    if (location.state?.notice) {
      setNotice(location.state.notice);
    }
  }, [location.state]);

  // Simple: This handles what happens when input change is triggered.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'email') {
      setVerificationEmail(value.trim().toLowerCase());
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (error) {
      clearError();
    }
  };

  // Simple: This handles what happens when resend verification is triggered.
  const handleResendVerification = async () => {
    const targetEmail = verificationEmail || formData.email.trim().toLowerCase();

    if (!targetEmail) {
      setNotice('Enter your email address first to resend verification.');
      return;
    }

    setResendingVerification(true);
    const result = await authService.resendVerificationEmail(targetEmail);
    setResendingVerification(false);

    if (result.success) {
      setNotice(result.message || 'Verification email sent. Please check your inbox.');
      setVerificationEmail(targetEmail);
    } else {
      setNotice(buildRetryMessage(result, result.error || 'Unable to resend verification email. Try again shortly.'));
    }
  };

  // Simple: This checks if the form is correct.
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Simple: This handles what happens when submit is triggered.
  //Login Customer
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    const result = await login({ ...formData });
    setLoading(false);

    if (result.success) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } else {
      if (result.code === 'EMAIL_NOT_VERIFIED') {
        const normalizedEmail = formData.email.trim().toLowerCase();
        setVerificationEmail(normalizedEmail);
        setNotice('Your email is not verified yet. Resend the verification email and complete verification to continue.');
      }
      setShowToast(true);
    }
  };

  return (
    <div className="min-h-screen flex overflow-x-hidden">
      {/* === Left Brand Panel (desktop only) === */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full" aria-hidden="true" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-white/5 rounded-full" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2" aria-hidden="true" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <FaUtensils className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Voleena Foods</span>
          </div>
        </div>

        {/* Center hero content */}
        <div className="relative z-10 text-white">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
            Authentic Sri Lankan Cuisine
          </h1>
          <p className="text-primary-100 text-lg leading-relaxed max-w-sm">
            Traditional meals, special combo packs, and catering services delivered fresh to your doorstep.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            {[
              { icon: FaCheckCircle, text: 'Traditional Sri Lankan meals' },
              { icon: FaCalendarAlt, text: 'Special Sunday combo offers' },
              { icon: FaTruck, text: 'Delivery within 15km radius' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-lg shrink-0">
                  <item.icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="text-primary-100 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-primary-200 text-sm">
            (c) {new Date().getFullYear()} Voleena Foods. All rights reserved.
          </p>
        </div>
      </div>

      {/* === Right Form Panel === */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-10 sm:py-12 bg-white lg:bg-slate-50/60 dark:bg-slate-900 dark:lg:bg-slate-900">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <FaUtensils className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-900 font-bold text-xl dark:text-slate-100">Voleena Foods</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight dark:text-slate-100">Welcome back</h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-slate-400">
              Sign in to your account to continue ordering
            </p>
          </div>

          {/* Notice Banner */}
          {notice && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
              <p>{notice}</p>
              {(verificationEmail || formData.email.trim()) && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                    className="font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700 disabled:opacity-60 text-xs"
                  >
                    {resendingVerification ? 'Sending verification email...' : 'Resend verification email'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 dark:bg-slate-800 dark:border-slate-700" style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.08)' }}>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <Input
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                required
                placeholder="you@example.com"
              />

              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={errors.password}
                  required
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-md p-1 dark:text-slate-500 dark:hover:text-slate-300 dark:focus-visible:ring-offset-slate-800"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={loading}
              >
                Sign in
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors dark:text-primary-400 dark:hover:text-primary-300">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>

      {showToast && error && (
        <Toast
          message={error}
          type="error"
          onClose={() => {
            setShowToast(false);
            clearError();
          }}
        />
      )}
    </div>
  );
};

export default Login;

