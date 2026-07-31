import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import { registerUser } from '../services/api';
import { toast } from 'react-toastify';

// Sri Lankan phone validation
const SL_PHONE_REGEX = /^(?:\+94|0)?[0-9]{9}$/;
const isValidSLPhone = (phone) => {
  if (!phone) return true; // optional field
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
  const brandName = settings?.shopName || 'Mobile Hub';
  const brandLogoUrl = settings?.logoUrl;
  const navigate = useNavigate();

  const handlePhoneChange = (value) => {
    setPhone(value);
    if (value && !isValidSLPhone(value)) {
      setPhoneError('Enter a valid Sri Lankan number (e.g., 0771234567 or +94771234567)');
    } else {
      setPhoneError('');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (phone && !isValidSLPhone(phone)) {
      toast.error('Please enter a valid Sri Lankan phone number');
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await registerUser({ name, email, password, phone });
      login(data);
      toast.success('Account created successfully! 🎉');
      navigate('/');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error || 
                       error.message || 
                       'Registration failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/50 py-16 px-4">
      <motion.div
        className="glass-card p-8 md:p-10 rounded-[2rem] w-full max-w-md"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold inline-flex items-center gap-2 mb-4">
            {brandLogoUrl && <img src={brandLogoUrl} alt={brandName} className="w-9 h-9 rounded-xl object-cover border border-slate-100" />}
            <span className="bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia bg-clip-text text-transparent font-black">{brandName}</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-800 mt-0 mb-2">Create Account</h1>
          <p className="text-slate-400 text-sm m-0 font-medium">Join {brandName} for tech and smart devices shopping</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4.5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2" htmlFor="reg-name">
              Full Name
            </label>
            <input
              type="text"
              id="reg-name"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo outline-none transition-all text-sm"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2" htmlFor="reg-email">
              Email Address
            </label>
            <input
              type="email"
              id="reg-email"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo outline-none transition-all text-sm"
              placeholder="yourname@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2" htmlFor="reg-phone">
              Phone Number <span className="text-[10px] text-slate-400 font-normal uppercase tracking-normal">({settings?.country || 'Sri Lankan'})</span>
            </label>
            <input
              type="tel"
              id="reg-phone"
              className={`w-full border rounded-xl px-4 py-3 focus:ring-2 outline-none transition-all text-sm ${
                phoneError ? 'border-red-400 focus:ring-red-300' : 'border-slate-200 focus:ring-brand-indigo/25 focus:border-brand-indigo'
              }`}
              placeholder="0771234567 or +94771234567"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
            />
            {phoneError && (
              <p className="text-xs text-red-500 mt-1 font-medium">{phoneError}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2" htmlFor="reg-password">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="reg-password"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo outline-none transition-all text-sm"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(99,102,241,0.25)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-indigo font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
