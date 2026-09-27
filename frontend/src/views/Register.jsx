'use client';

import { useState } from 'react';
import { Link, useNavigate } from '../utils/navigation';
import { Eye, EyeOff, UserPlus, Mail, Lock, Phone, User, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import { registerUser } from '../services/api';
import { getImageUrl } from '../utils/imageHelper';
import { toast } from 'react-toastify';

const SL_PHONE_REGEX = /^(?:\+94|0)?[0-9]{9}$/;
const isValidSLPhone = (phone) => {
  if (!phone) return true;
  return SL_PHONE_REGEX.test(phone.replace(/[\s\-()]/g, ''));
};

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const login = useAuthStore((state) => state.login);
  const settings = useSettingsStore((s) => s.settings);
  const brandName = settings?.shopName || 'Mobixa';
  const brandLogoUrl = getImageUrl(settings?.logoUrl || settings?.logo || '') || '/logo.png';
  const navigate = useNavigate();

  const handlePhoneChange = (value) => {
    setPhone(value);
    if (value && !isValidSLPhone(value)) {
      setPhoneError('Enter a valid Sri Lankan number (e.g. 0771234567)');
    } else {
      setPhoneError('');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (phone && !isValidSLPhone(phone)) { toast.error('Please enter a valid Sri Lankan phone number'); return; }
    setLoading(true);
    try {
      const { data } = await registerUser({ name, email, password, phone });
      login(data);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error || error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ds-auth-page">
      <div className="ds-auth-card" style={{ maxWidth: 480 }}>

        {/* Header */}
        <div className="ds-auth-card-header">
          <Link to="/" className="inline-flex items-center gap-2.5 no-underline mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-indigo via-brand-violet to-brand-fuchsia p-[2px] shadow-sm flex items-center justify-center flex-shrink-0">
              <img src={brandLogoUrl} alt={brandName} className="w-full h-full rounded-[10px] object-cover bg-white"
                onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }} />
            </div>
            <span className="bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia bg-clip-text text-transparent font-black text-lg tracking-tight">{brandName}</span>
          </Link>
          <h1 style={{ fontSize: 'var(--ds-text-xl)', fontWeight: 700, color: 'var(--ds-text-head)', margin: '0 0 0.375rem' }}>Create Account</h1>
          <p style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-muted)', margin: 0, fontWeight: 400 }}>Join {brandName} for tech &amp; smart devices shopping</p>
        </div>

        {/* Form */}
        <div className="ds-auth-card-body">
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

            {/* Full Name */}
            <div className="ds-form-group">
              <label className="ds-label" htmlFor="reg-name">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-text-muted)', pointerEvents: 'none' }} />
                <input type="text" id="reg-name" className="ds-input" style={{ paddingLeft: '2.25rem' }}
                  placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>

            {/* Email */}
            <div className="ds-form-group">
              <label className="ds-label" htmlFor="reg-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-text-muted)', pointerEvents: 'none' }} />
                <input type="email" id="reg-email" className="ds-input" style={{ paddingLeft: '2.25rem' }}
                  placeholder="yourname@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            {/* Phone */}
            <div className="ds-form-group">
              <label className="ds-label" htmlFor="reg-phone">
                Phone Number <span style={{ fontSize: 'var(--ds-text-2xs)', color: 'var(--ds-text-faint)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({settings?.country || 'Sri Lankan'}) optional</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-text-muted)', pointerEvents: 'none' }} />
                <input type="tel" id="reg-phone"
                  className="ds-input"
                  style={{ paddingLeft: '2.25rem', borderColor: phoneError ? '#f87171' : undefined }}
                  placeholder="0771234567 or +94771234567"
                  value={phone} onChange={(e) => handlePhoneChange(e.target.value)} />
              </div>
              {phoneError && <p className="ds-form-error">{phoneError}</p>}
            </div>

            {/* Password */}
            <div className="ds-form-group">
              <label className="ds-label" htmlFor="reg-password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-text-muted)', pointerEvents: 'none' }} />
                <input type={showPassword ? 'text' : 'password'} id="reg-password" className="ds-input"
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                  placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ds-text-muted)', padding: 0 }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="ds-form-hint">Use at least 6 characters including letters and numbers</p>
            </div>

            <button type="submit" disabled={loading} className="ds-btn ds-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.7rem 1rem', marginTop: '0.25rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <><div className="ds-spinner" style={{ width: '1rem', height: '1rem', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Creating Account...</>
              ) : (
                <><UserPlus size={16} /> Create Account</>
              )}
            </button>
          </form>
        </div>

        <div className="ds-auth-card-footer">
          Already have an account?{' '}
          <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
