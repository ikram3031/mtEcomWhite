import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Key, ShieldCheck, ShoppingBag, LogOut, Award, ArrowLeft, RefreshCw, Phone } from 'lucide-react';
import { useApp } from '../core/context/AppContext';
import {
  loginMember,
  registerMember,
  verifyMemberOtp,
  resendMemberOtp,
  forgotMemberPassword,
  resetMemberPassword,
  checkMemberEmail, // Import email checking API helper
} from '../core/lib/api';


export const AuthModal = () => {
  const {
    user,
    setUser,
    isAuthModalOpen,
    authModalMode,
    setAuthModal,
    addToast
  } = useApp();

  // Mapping developer jargon and backend validation failures to clean, descriptive customer-facing messages
  const getFriendlyErrorMessage = (error, defaultMsg = 'An unexpected error occurred. Please try again.') => {
    const rawMessage = error?.message || String(error);
    if (!rawMessage) return defaultMsg;

    const lowerMsg = rawMessage.toLowerCase();
    if (lowerMsg.includes('authorization header missing') || lowerMsg.includes('jwt malformed') || lowerMsg.includes('unauthorized')) {
      return 'Your authentication session has expired. Please log in again.';
    }
    if (lowerMsg.includes('invalid credentials') || lowerMsg.includes('password does not match') || lowerMsg.includes('incorrect password')) {
      return 'Invalid email or password. Please verify and try again.';
    }
    if (lowerMsg.includes('failed to fetch') || lowerMsg.includes('networkerror')) {
      return 'Network connection issue. Please check your internet connection.';
    }
    return rawMessage;
  };


  const [mode, setMode] = useState(authModalMode); // 'login' | 'register' | 'otp' | 'profile' | 'forgot' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpContext, setOtpContext] = useState('register');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loginStep, setLoginStep] = useState(1); // 1: check email status, 2: password input flow


  // OTP State (6 Digits)
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(180); // 3 minutes
  const [isResending, setIsResending] = useState(false);
  const otpInputsRef = useRef([]);

  const formatOtpTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Synchronize internal state with global state trigger
  React.useEffect(() => {
    setMode(authModalMode);
    setLoginStep(1); // Reset login flow step back to email check
  }, [authModalMode, isAuthModalOpen]);

  // OTP Countdown Timer
  useEffect(() => {
    if (mode !== 'otp') return;
    if (resendTimer <= 0) return;

    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, resendTimer]);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setAuthModal(false);
    setLoginStep(1); // Reset step back to 1 on modal close
    // Reset fields
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setPhone('');
    setOtpContext('register');
    setOtpValues(['', '', '', '', '', '']);
  };

  const validateEmail = (value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed) ? '' : 'Please enter a valid email address.';
  };

  // Normalize raw suffix input → strips leading 0 → returns 10-digit suffix only
  const normalizePhoneValue = (value) => {
    const digits = (value || '').replace(/\D/g, '');
    if (!digits) return '';
    // Strip leading 0 so user can enter 01XXXXXXXXX or 1XXXXXXXXX
    return digits.startsWith('0') ? digits.slice(1) : digits;
  };

  // Validate the suffix (10 digits) by constructing the full +880 number
  const validatePhoneValue = (suffix) => {
    if (!suffix) return 'Phone number is required.';
    const full = `+880${suffix}`;
    return /^\+8801[3-9]\d{8}$/.test(full)
      ? ''
      : 'Enter a valid number: 1[3-9]XXXXXXXX (after +880)';
  };

  const handlePhoneChange = (value) => {
    const suffix = normalizePhoneValue(value);
    setPhone(suffix); // store only the suffix, +880 prefix is fixed in UI
    if (phoneError) setPhoneError(validatePhoneValue(suffix));
  };

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpValues];
    newOtp[index] = value.slice(-1);
    setOtpValues(newOtp);

    // Auto-advance to next input field
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...otpValues];
    digits.forEach((digit, idx) => {
      newOtp[idx] = digit;
    });
    setOtpValues(newOtp);

    const focusIdx = Math.min(digits.length, 5);
    otpInputsRef.current[focusIdx]?.focus();
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otpValues.join('');
    if (code.length !== 6) {
      addToast('Please enter the full 6-digit verification code.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyMemberOtp({ email, otp: code, context: otpContext });
      const isVerified = response.isEmailVerified ?? response.data?.isEmailVerified ?? true;

      if (otpContext === 'forgot') {
        setMode('reset');
        setPassword('');
        setConfirmPassword('');
        addToast('OTP verified successfully. Set your new password to continue.', 'success');
        return;
      }

      if (response.requiresPasswordReset || response.data?.requiresPasswordReset) {
        setOtpContext('forgot');
        setMode('reset');
        setPassword('');
        setConfirmPassword('');
        addToast('OTP verified successfully. Please reset your password to activate your account.', 'success');
        return;
      }

      if (!isVerified) {
        addToast('Verification could not be completed. Please try again.', 'error');
        return;
      }

      const userData = response.user || response.data?.user || response.data || {};
      const displayName = userData.name || name || email.split('@')[0];
      const verifiedUser = {
        name: displayName,
        email: userData.email || email,
        phone: userData.phone || phone,
        tier: userData.tier || 'Privé Connoisseur',
        raw: userData,
      };

      const accessToken = response.accessToken || response.token || response.data?.token || response.data?.accessToken;
      const refreshToken = response.refreshToken || response.data?.refreshToken;

      setUser(verifiedUser, accessToken || refreshToken ? { accessToken, refreshToken } : null);
      addToast(`OTP verified successfully! Welcome, ${displayName}.`, 'success');
      handleClose();
    } catch (err) {
      addToast(getFriendlyErrorMessage(err, 'An unexpected error occurred. Please try again.'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Called manually by user pressing "Resend" button
  const handleResendOTPCode = async () => {
    if (resendTimer > 0 || isResending) return;
    await triggerResend();
  };

  const triggerResend = async () => {
    setIsResending(true);
    try {
      await resendMemberOtp({ email });
      addToast('A new 6-digit verification code has been dispatched to your email.', 'success');
      setResendTimer(180);
      setOtpValues(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      addToast('Failed to resend verification code. Please try again later.', 'error');
    } finally {
      setIsResending(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Step 1: Query email verification status
    if (loginStep === 1) {
      if (!email) {
        addToast('Please enter your email address.', 'error');
        return;
      }
      setIsLoading(true);
      try {
        const response = await checkMemberEmail({ email });

        // Trigger OTP verification flow if user email is unverified
        if (response.requiresOtp || response.isEmailVerified === false) {
          setOtpContext('login');
          setMode('otp');
          setResendTimer(180);
          addToast('Verification required. Enter the 6-digit code sent to your email.', 'info');
          return;
        }

        // Email verified, proceed to password submission step
        setLoginStep(2);
        addToast('Email verified. Please enter your password.', 'success');
      } catch (err) {
        addToast(getFriendlyErrorMessage(err, 'Email check failed. Please check the address.'), 'error');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Step 2: Validate password and log in
    if (loginStep === 2) {
      if (!email || !password) {
        addToast('Please enter both your email and password.', 'error');
        return;
      }

      setIsLoading(true);
      try {
        const response = await loginMember({ email, password });

        if (response.requiresOtp || response.isEmailVerified === false || response.data?.requiresOtp || response.data?.isEmailVerified === false) {
          setOtpContext('login');
          setMode('otp');
          setResendTimer(180);
          addToast('Verification required. Enter the 6-digit code sent to your email.', 'info');
          return;
        }

        const userData = response.user || response.data?.user || response.data || {};
        const accessToken = response.accessToken || response.token || response.data?.token || response.data?.accessToken;
        const refreshToken = response.refreshToken || response.data?.refreshToken;

        const displayName = userData.name || userData.fullName || email.split('@')[0];
        const loggedInUser = {
          name: displayName,
          email: userData.email || email,
          tier: userData.tier || 'Elite Connoisseur',
          raw: userData,
        };

        setUser(loggedInUser, { accessToken, refreshToken });
        addToast(`Login successful! Welcome back, ${displayName}.`, 'success');
        handleClose();
      } catch (err) {
        addToast(getFriendlyErrorMessage(err, 'Login failed. Please try again.'), 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const emailValidationError = validateEmail(email);
    const phoneValidationError = validatePhoneValue(phone);
    setEmailError(emailValidationError);
    setPhoneError(phoneValidationError);

    if (!name || !email || !phone || !password || !confirmPassword) {
      addToast('Please complete all fields.', 'error');
      return;
    }
    if (emailValidationError) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }
    if (phoneValidationError) {
      addToast('Please enter a valid Bangladeshi phone number.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      addToast('Your passwords do not match.', 'error');
      return;
    }
    if (password.length < 6) {
      addToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Combine fixed +880 prefix with the stored suffix to form a full BD number
      const memberPayload = {
        name: name.trim(),
        email: email.trim(),
        phone: `+880${phone}`,
        password,
      };

      const response = await registerMember(memberPayload);
      const userData = response.user || response.data || response;
      const accessToken = response.accessToken || response.token || response.data?.token || response.data?.accessToken;
      const refreshToken = response.refreshToken || response.data?.refreshToken;

      if (accessToken || refreshToken) {
        const displayName = userData.name || name;
        const registeredUser = {
          name: displayName,
          email: userData.email || email,
          phone: userData.phone || phone,
          tier: 'Privé Connoisseur',
          raw: userData,
        };
        setUser(registeredUser, { accessToken, refreshToken });
        addToast(`Welcome to Decantre, ${displayName}!`, 'success');
        handleClose();
      } else {
        setOtpContext('register');
        setMode('otp');
        setResendTimer(180);
        addToast('Account created! Please verify the 6-digit code sent to your email.', 'success');
      }
    } catch (err) {
      addToast(getFriendlyErrorMessage(err, 'Registration failed. Please try again later.'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const emailValidationError = validateEmail(email);
    setEmailError(emailValidationError);

    if (emailValidationError) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await forgotMemberPassword({ email });
      setOtpContext('forgot');
      setMode('otp');
      setResendTimer(180);
      addToast('A password reset OTP has been sent to your email.', 'success');
    } catch (err) {
      addToast(getFriendlyErrorMessage(err, 'Unable to request a password reset right now.'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      addToast('Please enter and confirm your new password.', 'error');
      return;
    }
    if (password.length < 6) {
      addToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      addToast('Your new passwords do not match.', 'error');
      return;
    }

    const code = otpValues.join('');
    if (code.length !== 6) {
      addToast('Please enter the full 6-digit verification code.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetMemberPassword({ email, otp: code, password });
      const userData = response.user || response.data?.user || response.data || {};
      const accessToken = response.accessToken || response.data?.accessToken;
      const refreshToken = response.refreshToken || response.data?.refreshToken;
      const displayName = userData.name || email.split('@')[0];
      const refreshedUser = {
        name: displayName,
        email: userData.email || email,
        phone: userData.phone || '',
        tier: userData.tier || 'Privé Connoisseur',
        raw: userData,
      };

      setUser(refreshedUser, { accessToken, refreshToken });
      addToast('Password reset complete. Your new member session is active.', 'success');
      handleClose();
    } catch (err) {
      addToast(getFriendlyErrorMessage(err, 'Password reset failed. Please try again.'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    addToast('You have been successfully logged out of your private session.', 'info');
    handleClose();
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
          className="relative w-full max-w-md max-h-[calc(100vh-3rem)] bg-zinc-900/95 border border-zinc-700/80 rounded-sm overflow-hidden shadow-2xl p-6 sm:p-8 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative Top Accent Line */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-gold/10 via-gold to-gold/10" />

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-gold border border-gold rounded-full transition-colors hover:bg-white/5 cursor-pointer"
            aria-label="Close credentials panel"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title Header */}
          <div className="text-center mb-8">
            <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-sans font-semibold block mb-2">
              Decantre
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-light text-white tracking-widest uppercase">
              {mode === 'profile' ? 'My Profile' : mode === 'otp' ? 'OTP Verification' : mode === 'login' ? 'Member Login' : mode === 'forgot' ? 'Forgot Password' : mode === 'reset' ? 'Reset Password' : 'Become a Member'}
            </h2>
          </div>

          {/* Mode Render: forgot password */}
          {mode === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-xs text-zinc-300 font-sans font-light leading-relaxed">
                  Enter your registered email to receive a password reset OTP.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gold/60 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    placeholder=""
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(validateEmail(e.target.value));
                    }}
                    onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                    className={`w-full bg-zinc-800/80 border ${emailError ? 'border-rose-500' : 'border-zinc-700/80'} focus:border-gold/60 rounded-sm py-3.5 pl-11 pr-4 text-xs font-sans text-white focus:outline-none transition-colors placeholder-zinc-500`}
                    required
                  />
                  {emailError && <p className="mt-1.5 text-[10px] text-rose-400">{emailError}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-zinc-500 hover:text-white flex items-center gap-1 cursor-pointer bg-transparent border-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full max-w-[220px] py-3 bg-gradient-to-r from-gold via-[#DAA520] to-gold hover:opacity-90 disabled:opacity-50 text-black font-sans text-xs uppercase tracking-[0.25em] font-bold transition-opacity flex items-center justify-center gap-2 cursor-pointer rounded-none border-none shadow-md"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-black border-r-transparent animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Send OTP</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : mode === 'reset' ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-xs text-zinc-300 font-sans font-light leading-relaxed">
                  Create a new password for:
                </p>
                <p className="text-xs font-mono text-gold font-semibold">"{email}"</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold block">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gold/60 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    placeholder=""
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-800/80 border border-zinc-700/80 focus:border-gold/60 rounded-sm py-3.5 pl-11 pr-4 text-xs font-sans text-white focus:outline-none transition-colors placeholder-zinc-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold block">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gold/60 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    placeholder=""
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-zinc-800/80 border border-zinc-700/80 focus:border-gold/60 rounded-sm py-3.5 pl-11 pr-4 text-xs font-sans text-white focus:outline-none transition-colors placeholder-zinc-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-gold via-[#DAA520] to-gold hover:opacity-90 disabled:opacity-50 text-black font-sans text-xs uppercase tracking-[0.25em] font-bold transition-opacity flex items-center justify-center gap-2 cursor-pointer rounded-none border-none shadow-md"
              >
                {isLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-black border-r-transparent animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
            </form>
          ) : mode === 'otp' ? (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-xs text-zinc-300 font-sans font-light leading-relaxed">
                  Verification code sent to:
                </p>
                <p className="text-xs font-mono text-gold font-semibold">"{email}"</p>
              </div>

              {/* 6 Digit Input Grid */}
              <div className="flex justify-between items-center gap-2 py-2" onPaste={handleOTPPaste}>
                {otpValues.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(idx, e)}
                    className="w-11 h-13 text-center bg-black border border-zinc-700 focus:border-gold rounded-sm text-lg font-mono font-bold text-gold focus:outline-none transition-all shadow-inner"
                  />
                ))}
              </div>

              {/* 3-Minute Countdown Timer */}
              <div className="flex flex-col items-center gap-1">
                <div className={`text-2xl font-mono font-bold tracking-widest tabular-nums ${
                  resendTimer === 0 ? 'text-rose-500' : resendTimer <= 30 ? 'text-amber-400' : 'text-gold'
                }`}>
                  {formatOtpTimer(resendTimer)}
                </div>
                <p className={`text-[10px] font-sans uppercase tracking-widest ${
                  resendTimer === 0 ? 'text-rose-400' : 'text-zinc-500'
                }`}>
                  {resendTimer === 0 ? 'Code expired — resending…' : 'Code expires in'}
                </p>
              </div>

              {/* Verification Button */}
              <button
                type="submit"
                disabled={isLoading || otpValues.join('').length !== 6 || resendTimer === 0}
                className="w-full py-4 bg-gradient-to-r from-gold via-[#DAA520] to-gold hover:opacity-90 disabled:opacity-40 text-black font-sans text-xs uppercase tracking-[0.25em] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border-none rounded-none shadow-lg"
              >
                {isLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-black border-r-transparent animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{resendTimer === 0 ? 'Code Expired' : 'Authorize Code'}</span>
                  </>
                )}
              </button>

              {/* Resend Controls */}
              <div className="flex items-center justify-between pt-2 text-[11px] font-sans">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-zinc-500 hover:text-white flex items-center gap-1 cursor-pointer bg-transparent border-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendOTPCode}
                  disabled={resendTimer > 0 || isResending}
                  className={`flex items-center gap-1.5 font-semibold bg-transparent border-none cursor-pointer ${
                    resendTimer > 0 || isResending ? 'text-zinc-600 cursor-not-allowed' : 'text-gold hover:underline'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>
                    {isResending ? 'Sending…' : resendTimer > 0 ? 'Resend Code' : 'Resend Now'}
                  </span>
                </button>
              </div>
            </form>
          ) : mode === 'profile' && user ? (
            <div className="space-y-6">
              {/* Profile Card Summary */}
              <div className="p-5 border border-gold/15 bg-zinc-950/50 rounded-none relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full filter blur-xl pointer-events-none" />
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gold/10 border border-gold/30 flex items-center justify-center rounded-none shrink-0 text-gold">
                    <User className="w-6 h-6 stroke-[1.25]" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="text-lg font-serif font-light text-white truncate">{user.name}</h3>
                    <p className="text-xs text-zinc-400 font-mono truncate">{user.email}</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <Award className="w-3.5 h-3.5 text-gold shrink-0" />
                      <span className="text-[10px] text-gold uppercase tracking-[0.15em] font-sans font-bold">
                        {user.tier}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-zinc-500">
                  <span>MEMBER SINCE</span>
                  <span className="text-zinc-300 font-sans uppercase tracking-widest">{user.memberSince || 'July 2026'}</span>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-zinc-400 font-semibold flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-gold" />
                  Order History ({user.orders?.length || 0})
                </h4>
                {user.orders && user.orders.length > 0 ? (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                    {user.orders.map((order) => (
                      <div key={order.id} className="p-3 bg-zinc-950 border border-white/5 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-mono text-zinc-300 block font-semibold">{order.id}</span>
                          <span className="text-[10px] text-zinc-500">{order.date}</span>
                        </div>
                        <div className="text-right space-y-0.5">
                          <span className="font-sans text-gold block font-semibold">{order.total}</span>
                          <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-zinc-900 border border-gold/20 text-gold font-medium inline-block">
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-zinc-950/20 border border-dashed border-white/5 text-center">
                    <p className="text-xs text-zinc-500 font-light font-sans">
                      You haven't commissioned any luxury fragrances yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Log out CTA */}
              <button
                onClick={handleLogout}
                className="w-full py-3.5 border border-rose-500/30 hover:border-rose-500 bg-rose-950/10 hover:bg-rose-950/30 text-rose-300 hover:text-white font-sans text-xs uppercase tracking-[0.2em] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Log Out Session</span>
              </button>
            </div>
          ) : (
            /* Forms for Login / Register */
            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-5">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gold/60 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder=""
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-800/80 border border-zinc-700/80 focus:border-gold/60 rounded-sm py-3.5 pl-11 pr-4 text-xs font-sans text-white focus:outline-none transition-colors placeholder-zinc-500"
                      required
                    />
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold block">
                    Phone Number
                  </label>
                  {/* Fixed +880 prefix block — ইউজার শুধু 1XXXXXXXXX বা 01XXXXXXXXX দেবে */}
                  <div className={`flex items-stretch bg-zinc-800/80 border ${phoneError ? 'border-rose-500' : 'border-zinc-700/80'} focus-within:border-gold/60 rounded-sm transition-colors`}>
                    <span className="flex items-center px-3 text-xs text-zinc-400 font-medium border-r border-zinc-700/80 select-none shrink-0">
                      +880
                    </span>
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-gold/60 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        placeholder="1712345678"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        onBlur={() => setPhoneError(validatePhoneValue(phone))}
                        maxLength={11}
                        className="w-full bg-transparent py-3.5 pl-9 pr-3 text-xs font-sans text-white focus:outline-none placeholder-zinc-500"
                        required
                      />
                    </div>
                  </div>
                  {phoneError && <p className="mt-1.5 text-[10px] text-rose-400">{phoneError}</p>}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gold/60 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    placeholder=""
                    value={email}
                    disabled={mode === 'login' && loginStep === 2}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(validateEmail(e.target.value));
                    }}
                    onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                    className={`w-full bg-zinc-800/80 border ${emailError ? 'border-rose-500' : 'border-zinc-700/80'} focus:border-gold/60 rounded-sm py-3.5 pl-11 pr-4 text-xs font-sans text-white focus:outline-none transition-colors placeholder-zinc-500 disabled:opacity-50`}
                    required
                  />
                  {emailError && <p className="mt-1.5 text-[10px] text-rose-400">{emailError}</p>}
                </div>
              </div>

              {/* Password field only shown directly for registration or step 2 of login */}
              {(mode === 'register' || (mode === 'login' && loginStep === 2)) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold block">
                      Password
                    </label>
                    {mode === 'login' && loginStep === 2 && (
                      <button
                        type="button"
                        onClick={() => setLoginStep(1)}
                        className="text-[10px] uppercase tracking-wider text-gold hover:underline cursor-pointer bg-transparent border-none outline-none flex items-center gap-1 font-bold"
                      >
                        <ArrowLeft className="w-3 h-3" /> Change Email
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gold/60 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      placeholder=""
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-800/80 border border-zinc-700/80 focus:border-gold/60 rounded-sm py-3.5 pl-11 pr-4 text-xs font-sans text-white focus:outline-none transition-colors placeholder-zinc-500"
                      required
                    />
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-semibold block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-gold/60 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      placeholder=""
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-zinc-800/80 border border-zinc-700/80 focus:border-gold/60 rounded-sm py-3.5 pl-11 pr-4 text-xs font-sans text-white focus:outline-none transition-colors placeholder-zinc-500"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-gold via-[#DAA520] to-gold hover:opacity-90 disabled:opacity-50 text-black font-sans text-xs uppercase tracking-[0.25em] font-bold transition-opacity flex items-center justify-center gap-2 cursor-pointer rounded-none border-none shadow-md"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-black border-r-transparent animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {mode === 'login'
                          ? (loginStep === 1 ? 'Next' : 'Log In')
                          : 'Become a Member'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Toggle Mode */}
              <div className="text-center pt-2 space-y-2">
                {mode === 'login' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="block w-full text-[10px] uppercase tracking-widest text-zinc-500 hover:text-gold transition-colors font-sans cursor-pointer bg-transparent border-none outline-none"
                    >
                      Forgot your password? <span className="text-gold font-bold underline">Reset here</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-gold transition-colors font-sans cursor-pointer bg-transparent border-none outline-none"
                    >
                      Don't have an account? <span className="text-gold font-bold underline">Register here</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-gold transition-colors font-sans cursor-pointer bg-transparent border-none outline-none"
                  >
                    Already registered? <span className="text-gold font-bold underline">Login here</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
