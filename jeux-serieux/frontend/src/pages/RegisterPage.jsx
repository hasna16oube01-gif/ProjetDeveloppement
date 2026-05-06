import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const AVATARS = ['🦁', '🐯', '🦊', '🐼', '🦄', '🐸', '🦋', '🐙'];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', avatar: '🦁' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-4">
      <motion.div
        className="card w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">✨</div>
          <h1 className="text-3xl font-fredoka text-purple-600">Créer un compte</h1>
        </div>

        {/* Role selector */}
        <div className="flex rounded-2xl border-2 border-gray-200 overflow-hidden mb-6">
          {[{ val: 'student', label: '🎒 Élève' }, { val: 'teacher', label: '👩‍🏫 Enseignant' }].map((r) => (
            <button
              key={r.val}
              type="button"
              onClick={() => setForm({ ...form, role: r.val })}
              className={`flex-1 py-3 font-bold transition-all ${
                form.role === r.val ? 'bg-purple-500 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Avatar picker (for students) */}
        {form.role === 'student' && (
          <div className="mb-4">
            <label className="block text-gray-600 font-bold mb-2">🎭 Choisis ton avatar</label>
            <div className="flex gap-2 flex-wrap">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setForm({ ...form, avatar: av })}
                  className={`text-3xl p-2 rounded-xl transition-all ${
                    form.avatar === av ? 'bg-purple-100 scale-125 ring-2 ring-purple-400' : 'hover:bg-gray-100'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-600 font-bold mb-1">👤 Prénom / Nom</label>
            <input
              className="input-field"
              placeholder="Ton prénom"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-gray-600 font-bold mb-1">📧 Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="ton@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-gray-600 font-bold mb-1">🔒 Mot de passe</label>
            <input
              type="password"
              className="input-field"
              placeholder="Min. 6 caractères"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-600 font-bold p-3 rounded-2xl text-center">
              ❌ {error}
            </div>
          )}

          <motion.button
            type="submit"
            className="btn-secondary w-full text-lg"
            disabled={loading}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? '⏳ Création...' : '🎉 Créer mon compte'}
          </motion.button>
        </form>

        <p className="text-center mt-4 text-gray-500 font-semibold">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-purple-500 font-bold hover:underline">
            Se connecter
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
