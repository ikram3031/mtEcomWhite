import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, Eye, EyeOff, Shield, QrCode, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { handleGlobalError } from '@/lib/error-handler';
import { toast } from 'sonner';
import { DecantreLogo } from '@/components/DecantreLogo';
import { apiClient } from '@/lib/api-client';


const LoginPage = () => {
  const { user, login, verify2fa, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2FA state variables
  const [step, setStep] = useState(1); // 1: Credentials, 2: 2FA Screen
  const [otpCode, setOtpCode] = useState('');
  const [is2faVerifying, setIs2faVerifying] = useState(false);
  const [isRequestingQr, setIsRequestingQr] = useState(false);


  useEffect(() => {
    if (!isAuthLoading && user) {
      navigate('/dashboard');
    }
  }, [user, isAuthLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      if (res && res.requires2fa) {
        setStep(2);
        toast.info('Verification required. Enter the code from your Google Authenticator app.');
      } else {
        toast.success('Logged in successfully.');
      }
    } catch (err) {
      handleGlobalError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      toast.error('Please enter the full 6-digit OTP code.');
      return;
    }

    setIs2faVerifying(true);
    try {
      await verify2fa(email, password, cleanCode);
      toast.success('2FA verified. Welcome to the Dashboard.');
    } catch (err) {
      handleGlobalError(err);
    } finally {
      setIs2faVerifying(false);
    }
  };

  const handleSendQrCode = async () => {
    setIsRequestingQr(true);
    try {
      const response = await apiClient.post('/api/v1/auth/2fa/send-qr', { email, password });
      toast.success(response.data?.message || 'QR Code has been sent to your email.');
    } catch (err) {
      handleGlobalError(err);
    } finally {
      setIsRequestingQr(false);
    }
  };

  const handleCancel2FA = () => {
    setStep(1);
    setOtpCode('');
  };


  if (isAuthLoading) {
    return (
      <div className="dark h-screen w-screen bg-background flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="h-8 w-8 border-3 border-border border-t-primary rounded-full animate-spin" />
        <span className="text-xs font-medium font-sans">Booting secure session...</span>
      </div>
    );
  }

  return (
    <div className="dark h-screen w-screen max-h-screen bg-background text-foreground flex items-center justify-center p-3 relative overflow-hidden font-sans selection:bg-indigo-500/35 selection:text-foreground">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-70 animate-pulse [animation-duration:8s]" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none opacity-40 animate-pulse [animation-duration:12s]" />
      <div className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none opacity-45 animate-pulse [animation-duration:10s]" />

      <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-30" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[400px] relative z-10 my-auto"
      >
        <Card className="shadow-2xl border-border bg-card/90 text-card-foreground backdrop-blur-xl overflow-hidden rounded-2xl">
          <CardHeader className="px-5 pt-5 pb-3 text-center border-b border-border/80 bg-card/40">
            
            <CardTitle className="text-xl font-bold tracking-tight flex items-center justify-center gap-1.5 text-foreground">
              {step === 1 ? <DecantreLogo className="h-8 w-auto mx-auto mb-1.5" /> : '2FA VERIFICATION'}
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
              {step === 1 ? 'Secure store administration portal' : 'Google Authenticator verification'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-3.5">
            {step === 1 ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-muted-foreground">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60">
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-9 text-xs bg-background/60 border-border text-foreground focus:border-primary placeholder:text-muted-foreground/40 rounded-lg"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-muted-foreground">
                      Password
                    </label>
                    <a href="#" className="text-[11px] text-muted-foreground hover:text-foreground hover:underline">
                      Forgot?
                    </a>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60">
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 h-9 text-xs bg-background/60 border-border text-foreground focus:border-primary placeholder:text-muted-foreground/40 rounded-lg"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="sm"
                    className="w-full h-9 flex items-center justify-center font-semibold text-xs bg-foreground hover:bg-foreground/90 text-background transition cursor-pointer shadow-md rounded-lg"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2" />
                    ) : (
                      <LogIn className="h-3.5 w-3.5 mr-1" />
                    )}
                    {isSubmitting ? 'Signing In…' : 'Log In'}
                  </Button>
                </div>

              </form>
            ) : (
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-muted-foreground">
                    Google Authenticator Code
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                    </span>
                    <Input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="pl-9 h-9 text-xs bg-background/60 border-border text-foreground focus:border-primary placeholder:text-muted-foreground/40 rounded-lg tracking-[0.5em] text-center font-bold"
                      placeholder="000000"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    type="submit"
                    disabled={is2faVerifying}
                    size="sm"
                    className="w-full h-9 flex items-center justify-center font-semibold text-xs bg-primary hover:bg-primary/95 text-black transition cursor-pointer shadow-md rounded-lg"
                  >
                    {is2faVerifying ? (
                      <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                    ) : (
                      <Shield className="h-3.5 w-3.5 mr-1" />
                    )}
                    {is2faVerifying ? 'Verifying…' : 'Verify Code'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isRequestingQr}
                    onClick={handleSendQrCode}
                    className="w-full h-9 flex items-center justify-center font-semibold text-xs border-border bg-background/40 hover:bg-background/80 transition cursor-pointer shadow-sm rounded-lg"
                  >
                    {isRequestingQr ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    ) : (
                      <QrCode className="h-3.5 w-3.5 mr-1" />
                    )}
                    Get QR Code via Email
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancel2FA}
                    className="w-full h-9 flex items-center justify-center font-semibold text-xs text-muted-foreground hover:text-foreground hover:bg-background/20 transition cursor-pointer rounded-lg"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
      {/* Fixed version label at bottom of page */}
      <p className="fixed bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/80 font-mono z-20 select-none">
        v{__APP_VERSION__}
      </p>
    </div>
  );
};

export default LoginPage;
