import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-4">
      <motion.div
        className="card w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🔑</div>
          <h1 className="text-3xl font-fredoka text-blue-600">Connexion</h1>
          <p className="text-gray-500 font-semibold">Bon retour, aventurier !</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-600 font-bold p-3 rounded-2xl text-center">
              ❌ {error}
            </div>
          )}

          <motion.button
            type="submit"
            className="btn-primary w-full text-lg"
            disabled={loading}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? '⏳ Connexion...' : '🚀 Se connecter'}
          </motion.button>
        </form>

        <p className="text-center mt-6 text-gray-500 font-semibold">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-blue-500 font-bold hover:underline">
            S'inscrire
          </Link>
        </p>
        <p className="text-center mt-2">
          <Link to="/" className="text-gray-400 font-semibold hover:text-gray-600 text-sm">
            ← Retour à l'accueil
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
