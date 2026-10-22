import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Shield, AlertCircle, Eye, EyeOff, CheckCircle2, Building2, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { locationService } from '../../services/locationService';
import confetti from 'canvas-confetti';
import './Auth.css';

const getStrength = (pwd) => {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
};
const strengthColors = ['#EF4444', '#F59E0B', '#EAB308', '#10B981'];
const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

const SEGMENTS = {
  staff:  { label: 'Staff',  desc: 'Team member at a tax office' },
  client: { label: 'Client', desc: 'Taxpayer who uploads their own documents' },
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [segment, setSegment] = useState('staff');
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    role: '',
    firstName: '', lastName: '', mobile: '', dob: '', gender: '',
    address: '', locationName: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [locations, setLocations] = useState([]);

  const strength = getStrength(form.password);

  // Load locations for the client segment
  useEffect(() => {
    locationService.getAll().then(r => setLocations(r.data)).catch(() => {});
  }, []);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (segment === 'client') {
      if (!form.mobile.trim()) e.mobile = 'Mobile is required';
      if (form.dob && new Date(form.dob) > new Date()) e.dob = 'DOB cannot be in the future';
      if (form.mobile && !/^[6-9]\d{9}$/.test(form.mobile) && form.mobile.length !== 10) {
        e.mobile = 'Enter a valid 10-digit mobile number';
      }
    }
    if (!agreed) e.terms = 'You must agree to the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        role: segment === 'client' ? 'CLIENT' : undefined,
        dob: form.dob || null,
      };
      const response = await register(payload);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setSuccess(true);
      setTimeout(() => {
        navigate(response.role === 'CLIENT' ? '/portal' : '/dashboard');
      }, 1500);
    } catch (err) {
      setServerError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (success) {
    const dest = form.role === 'CLIENT' || segment === 'client' ? 'Your Portal' : 'Dashboard';
    return (
      <div className="auth-success-overlay">
        <CheckCircle2 size={64} color="#10B981" />
        <h2>🎉 Account Created!</h2>
        <p>Redirecting to {dest}...</p>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Left form panel */}
      <div className="auth-form-panel">
        <motion.div
          className="auth-form-card"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-form-logo">D</div>
          <h1>Create your account</h1>
          <p className="auth-subtitle">
            {segment === 'client'
              ? 'Sign up as a taxpayer and upload your documents yourself'
              : 'Sign up as a team member to manage client records'}
          </p>

          {/* Segment toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {Object.entries(SEGMENTS).map(([key, { label, desc }]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setSegment(key); setErrors({}); setServerError(''); }}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `2px solid ${segment === key ? '#2563EB' : '#E2E8F0'}`,
                  background: segment === key ? '#EFF6FF' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {key === 'staff' ? <Building2 size={18} color={segment === key ? '#2563EB' : '#94A3B8'} /> : <User size={18} color={segment === key ? '#2563EB' : '#94A3B8'} />}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: segment === key ? '#1E40AF' : '#334155' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.3, marginTop: 2 }}>{desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {serverError && (
            <div className="auth-error-msg" style={{ marginBottom: 16, padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, fontSize: 13 }}>
              <AlertCircle size={14} /> {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ── Client intake fields ── */}
            {segment === 'client' && (
              <>
                <div style={{ marginBottom: 16, padding: '10px 14px', background: '#EEF2FF', borderRadius: 8, fontSize: 12, color: '#3730A3', fontWeight: 500 }}>
                  📋 Tell us a bit about yourself — this creates your document profile
                </div>

                <div className="auth-input-group">
                  <label>First Name</label>
                  <div className="auth-input-wrap">
                    <User className="auth-input-icon" size={18} />
                    <input className={`auth-input ${errors.firstName ? 'error' : ''}`} placeholder="Rahul" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                  </div>
                  {errors.firstName && <div className="auth-error-msg"><AlertCircle size={12} /> {errors.firstName}</div>}
                </div>

                <div className="auth-input-group">
                  <label>Last Name</label>
                  <div className="auth-input-wrap">
                    <User className="auth-input-icon" size={18} />
                    <input className={`auth-input ${errors.lastName ? 'error' : ''}`} placeholder="Sharma" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                  </div>
                  {errors.lastName && <div className="auth-error-msg"><AlertCircle size={12} /> {errors.lastName}</div>}
                </div>

                <div className="auth-input-group">
                  <label>Mobile Number</label>
                  <div className="auth-input-wrap">
                    <Mail className="auth-input-icon" size={18} />
                    <input
                      className={`auth-input ${errors.mobile ? 'error' : ''}`}
                      type="tel"
                      placeholder="9876543210"
                      value={form.mobile}
                      onChange={e => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      inputMode="numeric"
                    />
                  </div>
                  {errors.mobile && <div className="auth-error-msg"><AlertCircle size={12} /> {errors.mobile}</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="auth-input-group">
                    <label>Date of Birth</label>
                    <input
                      className={`auth-input ${errors.dob ? 'error' : ''}`}
                      type="date"
                      value={form.dob}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={e => set('dob', e.target.value)}
                      style={{ width: '100%' }}
                    />
                    {errors.dob && <div className="auth-error-msg"><AlertCircle size={12} /> {errors.dob}</div>}
                  </div>
                  <div className="auth-input-group">
                    <label>Gender</label>
                    <select
                      className="auth-input"
                      value={form.gender || ''}
                      onChange={e => set('gender', e.target.value)}
                      style={{ width: '100%', background: '#fff' }}
                    >
                      <option value="">Prefer not to say</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>Residential Address</label>
                  <textarea
                    className="auth-input"
                    placeholder="House / street / city"
                    rows={2}
                    value={form.address}
                    onChange={e => set('address', e.target.value)}
                    style={{ width: '100%', resize: 'none', background: '#fff' }}
                  />
                </div>

                <div className="auth-input-group">
                  <label>Office / City</label>
                  <div className="auth-input-wrap">
                    <MapPin className="auth-input-icon" size={18} />
                    <select
                      value={form.locationName || ''}
                      onChange={e => set('locationName', e.target.value)}
                      style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: 'inherit' }}
                    >
                      <option value="">Select your city / office…</option>
                      {locations.map(l => (
                        <option key={l.id} value={l.locationName}>{l.locationName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* ── Shared fields ── */}
            <div className="auth-input-group">
              <label>Full Name (Account)</label>
              <div className="auth-input-wrap">
                <User className="auth-input-icon" size={18} />
                <input
                  className={`auth-input ${errors.fullName ? 'error' : ''}`}
                  placeholder="John Doe"
                  value={form.fullName}
                  onChange={e => set('fullName', e.target.value)}
                  disabled={segment === 'client'}
                />
              </div>
              {errors.fullName && <div className="auth-error-msg"><AlertCircle size={12} /> {errors.fullName}</div>}
            </div>

            <div className="auth-input-group">
              <label>Email Address</label>
              <div className="auth-input-wrap">
                <Mail className="auth-input-icon" size={18} />
                <input
                  className={`auth-input ${errors.email ? 'error' : ''}`}
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
              </div>
              {errors.email && <div className="auth-error-msg"><AlertCircle size={12} /> {errors.email}</div>}
            </div>

            <div className="auth-input-group">
              <label>Password</label>
              <div className="auth-input-wrap">
                <Lock className="auth-input-icon" size={18} />
                <input
                  className={`auth-input ${errors.password ? 'error' : ''}`}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPwd(s => !s)}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.password && (
                <>
                  <div className="strength-bar">
                    {[0,1,2,3].map(i => (
                      <div key={i} className="strength-segment" style={{ background: i < strength ? strengthColors[strength - 1] : undefined }} />
                    ))}
                  </div>
                  <div className="strength-label" style={{ color: strengthColors[strength - 1] || '#94A3B8' }}>
                    {strengthLabels[strength - 1] || 'Too short'}
                  </div>
                </>
              )}
              {errors.password && <div className="auth-error-msg"><AlertCircle size={12} /> {errors.password}</div>}
            </div>

            <div className="auth-input-group">
              <label>Confirm Password</label>
              <div className="auth-input-wrap">
                <Shield className="auth-input-icon" size={18} />
                <input
                  className={`auth-input ${errors.confirmPassword ? 'error' : ''}`}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)}
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm(s => !s)}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <div className="auth-error-msg"><AlertCircle size={12} /> {errors.confirmPassword}</div>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="auth-checkbox-label">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                I agree to the{' '}
                <a href="#" style={{ color: '#2563EB', fontWeight: 500 }}>Terms of Service</a>{' '}
                and{' '}
                <a href="#" style={{ color: '#2563EB', fontWeight: 500 }}>Privacy Policy</a>
              </label>
              {errors.terms && (
                <div className="auth-error-msg" style={{ marginTop: 4 }}>
                  <AlertCircle size={12} /> {errors.terms}
                </div>
              )}
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading
                ? <><span className="auth-spinner" /> Creating account…</>
                : segment === 'client' ? 'Create Client Account →' : 'Create Staff Account →'}
            </button>
          </form>

          <div className="auth-bottom-link">
            Already have an account? <Link to="/login">Sign in →</Link>
          </div>
        </motion.div>
      </div>

      {/* Right decorative panel */}
      <div
        className="auth-deco"
        style={{ background: segment === 'client' ? 'linear-gradient(145deg, #0E7490 0%, #1E40AF 100%)' : 'linear-gradient(145deg, #065F46 0%, #0369A1 100%)' }}
      >
        <div className="auth-deco-circles">
          <div className="auth-deco-circle auth-deco-circle-1" />
          <div className="auth-deco-circle auth-deco-circle-2" />
        </div>
        <div className="auth-deco-content">
          <div className="auth-deco-logo">D</div>
          <h2>{segment === 'client' ? 'Your Documents, Securely.' : 'Join 500+ Companies'}</h2>
          <p>
            {segment === 'client'
              ? 'Upload W-2s, 1099s, IDs, and more — no need to visit the office.'
              : 'Manage client records, identity documents, and family relationships in one secure platform.'}
          </p>
          <div className="auth-deco-pills">
            {segment === 'client' ? (
              <>
                <span className="auth-deco-pill">📋 W-2 & 1099</span>
                <span className="auth-deco-pill">🪪 IDs & SSN</span>
                <span className="auth-deco-pill">🔒 Encrypted</span>
              </>
            ) : (
              <>
                <span className="auth-deco-pill">📄 OCR Validation</span>
                <span className="auth-deco-pill">🌳 Family Trees</span>
                <span className="auth-deco-pill">📊 Analytics</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
