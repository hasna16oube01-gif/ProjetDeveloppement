import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiBookOpen } from 'react-icons/fi';
import { BsRobot } from 'react-icons/bs';

const AVATARS = [
  '/av1.png', '/av2.png', '/av3.png', '/av4.png', '/av5.png',
  '/av6.png', '/av7.png', '/av8.png', '/av9.png', '/av10.png',
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', avatar: '/av1.png' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPage, setAvatarPage] = useState(0); // 0 = first 8, pagination arrows
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  // Show 4 avatars per page → 3 pages for 10 avatars (4 / 4 / 2)
  const perPage = 4;
  const totalPages = Math.ceil(AVATARS.length / perPage);
  const visibleAvatars = AVATARS.slice(avatarPage * perPage, avatarPage * perPage + perPage);

  return (
    <div
      className="min-h-screen relative flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: "url('/register-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-indigo-950/40 pointer-events-none" />

      {/* ── CARD ── */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div
          className="rounded-3xl p-8"
          style={{
            background: 'rgba(30, 20, 60, 0.72)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 8px 48px 0 rgba(80,40,160,0.35)',
          }}
        >
          {/* Icon + Title */}
          <div className="text-center mb-5">
            <div className="text-4xl mb-1">✨</div>
            <h1 className="text-3xl font-extrabold text-white">Créer un compte</h1>
          </div>

          {/* Role Selector */}
          <div className="flex rounded-full overflow-hidden border border-white/20 mb-6 bg-white/5">
            {[
              { val: 'student', label: '📖 Élève' },
              { val: 'teacher', label: '🖊️ Enseignant' },
            ].map((r) => (
              <button
                key={r.val}
                type="button"
                onClick={() => setForm({ ...form, role: r.val })}
                className={`flex-1 py-2.5 font-bold text-sm transition-all ${
                  form.role === r.val
                    ? 'bg-rose-700/80 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Avatar Picker */}
          {form.role === 'student' && (
            <div className="mb-5">
              <p className="text-white text-center font-semibold mb-3">Choisis ton avatar</p>
              <div className="relative flex items-center gap-2">
                {/* Prev */}
                <button
                  type="button"
                  onClick={() => setAvatarPage((p) => Math.max(0, p - 1))}
                  disabled={avatarPage === 0}
                  className="text-white/50 hover:text-white text-2xl disabled:opacity-20 flex-shrink-0"
                >
                  ‹
                </button>

                <div className="grid grid-cols-4 gap-3 flex-1">
                  {visibleAvatars.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setForm({ ...form, avatar: av })}
                      className={`relative rounded-xl overflow-hidden aspect-square transition-all ${
                        form.avatar === av
                          ? 'ring-2 ring-yellow-400 scale-105 shadow-lg shadow-yellow-500/30'
                          : 'opacity-75 hover:opacity-100'
                      }`}
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                      }}
                    >
                      <img src={av} alt="avatar" className="w-full h-full object-cover" />
                      {form.avatar === av && (
                        <div className="absolute inset-0 rounded-xl ring-2 ring-yellow-400 pointer-events-none" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Next */}
                <button
                  type="button"
                  onClick={() => setAvatarPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={avatarPage === totalPages - 1}
                  className="text-white/50 hover:text-white text-2xl disabled:opacity-20 flex-shrink-0"
                >
                  ›
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
              <input
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                placeholder="Votre Prénom / Nom"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            {/* Email */}
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
              <input
                type="email"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                placeholder="Votre Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                placeholder="Votre Mot de passe"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
              >
                {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center font-medium">❌ {error}</p>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 rounded-xl font-extrabold text-white text-base transition-all mt-1"
              style={{
                background: 'linear-gradient(90deg, #3b2fa0 0%, #4f46e5 50%, #3b2fa0 100%)',
                border: '1px solid rgba(160,130,255,0.4)',
                boxShadow: '0 0 20px rgba(99,80,220,0.4)',
              }}
            >
              {loading ? '⏳ Création...' : "Rejoindre l'aventure"}
            </motion.button>
          </form>

          <p className="text-center mt-4 text-white/50 text-sm">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-white font-bold hover:underline">
              Se connecter.
            </Link>
          </p>
        </div>
      </motion.div>

      {/* ── LUMI ROBOT ── */}
      <div className="absolute bottom-6 right-6 z-10 flex items-end gap-3">
        <div className="bg-white rounded-2xl px-3 py-2 text-slate-700 text-xs font-medium shadow-lg relative">
          Une question ? Je suis là !
          <div className="absolute bottom-3 right-[-8px] w-4 h-4 bg-white rotate-45" />
        </div>
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-xl">
            <BsRobot className="text-white w-8 h-8" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
