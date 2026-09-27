'use client';

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from '../utils/navigation';
import { KeyRound, Mail, ShieldCheck, Lock, ArrowLeft, ArrowRight, Eye, EyeOff, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { requestPasswordReset, verifyResetOtp, resetPassword } from '../services/api';
import useSettingsStore from '../store/settingsStore';
import { getImageUrl } from '../utils/imageHelper';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const settings = useSettingsStore((s) => s.settings);
  const brandName = settings?.shopName || 'Mobixa';
  const logoSrc = getImageUrl(settings?.logoUrl || settings?.logo || '') || '/logo.png';

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const otpInputsRef = useRef([]);

  useEffect(() => {
    let timer;
    if (step === 2 && resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) { toast.error('Please enter a valid email address'); return; }
    setLoading(true);
    try {
      const res = await requestPasswordReset(email.trim());
      toast.success(res.data.message || 'Verification code sent!');
      setStep(2); setResendTimer(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification code');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) otpInputsRef.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpInputsRef.current[index - 1]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) { toast.error('Please enter all 6 digits'); return; }
    setLoading(true);
    try {
      const res = await verifyResetOtp(email.trim(), fullOtp);
      toast.success(res.data.message || 'OTP Verified!');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid verification code');
    } finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const res = await requestPasswordReset(email.trim());
      toast.info(res.data.message || 'New code sent!');
      setResendTimer(60); setOtp(['', '', '', '', '', '']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await resetPassword(email.trim(), otp.join(''), newPassword);
      toast.success(res.data.message || 'Password reset successfully!');
      setStep(4);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  /* Step icons & titles */
  const stepConfig = {
    1: { icon: <Mail size={22} />, title: 'Password Recovery', sub: 'Enter your account email to receive a verification code' },
    2: { icon: <KeyRound size={22} />, title: 'Verify Code', sub: `Enter the 6-digit code sent to ${email}` },
    3: { icon: <Lock size={22} />, title: 'New Password', sub: 'Create a strong new password for your account' },
    4: { icon: <CheckCircle size={22} />, title: 'All Done!', sub: 'Your password has been successfully updated' },
  };
  const sc = stepConfig[step];

  return (
    <div className="ds-auth-page">
      <div className="ds-auth-card">

        {/* Header */}
        <div className="ds-auth-card-header">
          <Link to="/" className="inline-flex items-center gap-2.5 no-underline mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-indigo via-brand-violet to-brand-fuchsia p-[2px] shadow-sm flex items-center justify-center flex-shrink-0">
              <img src={logoSrc} alt={brandName} className="w-full h-full rounded-[10px] object-cover bg-white"
                onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }} />
            </div>
            <span className="bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia bg-clip-text text-transparent font-black text-base tracking-tight">{brandName}</span>
          </Link>

          {/* Step indicator icon */}
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--ds-r-lg)',
            background: step === 4 ? '#f0fdf4' : 'var(--ds-primary-10)',
            border: `1px solid ${step === 4 ? '#bbf7d0' : 'var(--ds-primary-30)'}`,
            color: step === 4 ? '#15803d' : 'var(--ds-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            {sc.icon}
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'center', marginBottom: '0.75rem' }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{
                width: s < step ? 20 : 8, height: 8, borderRadius: 999,
                background: s <= step ? 'var(--ds-primary)' : 'var(--ds-border)',
                transition: 'all 0.3s'
              }} />
            ))}
          </div>

          <h1 style={{ fontSize: 'var(--ds-text-xl)', fontWeight: 700, color: 'var(--ds-text-head)', margin: '0 0 0.375rem' }}>{sc.title}</h1>
          <p style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-muted)', margin: 0, fontWeight: 400 }}>{sc.sub}</p>
        </div>

        <div className="ds-auth-card-body">

          {/* ── STEP 1: Email ── */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="ds-form-group">
                <label className="ds-label">Registered Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-text-muted)', pointerEvents: 'none' }} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com" className="ds-input" style={{ paddingLeft: '2.25rem' }} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="ds-btn ds-btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.7rem', opacity: loading ? 0.7 : 1 }}>
                {loading
                  ? <><div className="ds-spinner" style={{ width: '1rem', height: '1rem', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Sending Code...</>
                  : <>Send Verification Code <ArrowRight size={16} /></>}
              </button>
              <div style={{ textAlign: 'center' }}>
                <Link to="/login" style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                  <ArrowLeft size={13} /> Back to Login
                </Link>
              </div>
            </form>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="ds-form-group">
                <label className="ds-label" style={{ textAlign: 'center', display: 'block' }}>6-Digit Verification Code</label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {otp.map((digit, idx) => (
                    <input key={idx} ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      style={{
                        width: 44, height: 52, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem',
                        fontFamily: 'monospace', background: '#f8fafc', border: '1.5px solid var(--ds-border)',
                        borderRadius: 'var(--ds-r-md)', outline: 'none', color: 'var(--ds-text-head)',
                        transition: 'border-color 0.15s, box-shadow 0.15s'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--ds-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--ds-primary-10)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--ds-border)'; e.target.style.boxShadow = 'none'; }}
                    />
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading} className="ds-btn ds-btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.7rem', opacity: loading ? 0.7 : 1 }}>
                {loading
                  ? <><div className="ds-spinner" style={{ width: '1rem', height: '1rem', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Verifying...</>
                  : <>Verify Code <ShieldCheck size={16} /></>}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--ds-border)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setStep(1)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--ds-text-xs)', fontWeight: 600, color: 'var(--ds-text-muted)', padding: 0 }}>
                  Change Email
                </button>
                <button type="button" disabled={resendTimer > 0 || loading} onClick={handleResendOtp}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: resendTimer > 0 ? 'not-allowed' : 'pointer', fontSize: 'var(--ds-text-xs)', fontWeight: 600, color: resendTimer > 0 ? 'var(--ds-text-faint)' : 'var(--ds-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: New Password ── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="ds-form-group">
                <label className="ds-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-text-muted)', pointerEvents: 'none' }} />
                  <input type={showPassword ? 'text' : 'password'} required value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters"
                    className="ds-input" style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ds-text-muted)', padding: 0 }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="ds-form-group">
                <label className="ds-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-text-muted)', pointerEvents: 'none' }} />
                  <input type={showPassword ? 'text' : 'password'} required value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password"
                    className="ds-input" style={{ paddingLeft: '2.25rem' }} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="ds-btn ds-btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.7rem', opacity: loading ? 0.7 : 1 }}>
                {loading
                  ? <><div className="ds-spinner" style={{ width: '1rem', height: '1rem', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Resetting Password...</>
                  : <>Update Password <ShieldCheck size={16} /></>}
              </button>
            </form>
          )}

          {/* ── STEP 4: Success ── */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(22,163,74,0.2)', animation: 'dsSpinAnim 0s' }}>
                <CheckCircle size={36} />
              </div>
              <h3 style={{ fontSize: 'var(--ds-text-lg)', fontWeight: 700, color: 'var(--ds-text-head)', margin: 0 }}>Password Reset Successful!</h3>
              <p style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-muted)', margin: 0 }}>
                Your password has been securely updated. Redirecting to login...
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', animation: `livePulse 1.4s ${i * 0.3}s infinite` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="ds-auth-card-footer">
          Remember your password?{' '}
          <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
