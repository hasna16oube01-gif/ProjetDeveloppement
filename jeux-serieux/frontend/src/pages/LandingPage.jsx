import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLogIn, FiUserPlus, FiZap } from 'react-icons/fi';
import { FiBookOpen } from 'react-icons/fi';

export default function LandingPage() {
  return (
    <div
      className="min-h-screen relative flex flex-col overflow-hidden"
      style={{
        backgroundImage: "url('/landing-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-purple-900/20 to-indigo-950/50 pointer-events-none" />

      {/* ── HEADER ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-3 bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <FiBookOpen className="text-white w-4 h-4" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">LumiStory</span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/40 text-white text-sm font-medium hover:bg-white/10 transition-all">
          <FiZap className="w-4 h-4 text-yellow-300" />
          Découvrir LumiStory
        </button>
      </header>

      {/* ── MAIN ── */}
      <main className="relative z-10 flex-1 flex items-center justify-start px-10 md:px-20">
        <motion.div
          className="max-w-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-lg mb-4">
            <span className="text-yellow-300">⭐</span>{' '}
            Bienvenue dans<br />l'aventure LumiStory{' '}
            <span>📖</span>
          </h1>

          {/* Description */}
          <p className="text-white/80 text-base leading-relaxed mb-8 max-w-sm">
            L'apprentissage devient une quête, les histoires deviennent des défis.
            Transformez l'apprentissage en une aventure ludique et personnalisée
            grâce à l'intelligence artificielle.<br />
            Pour les élèves, pour les enseignants.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4">
            <Link to="/login">
              <motion.button
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-900/40 transition-all"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <FiLogIn className="w-4 h-4" />
                Se connecter
              </motion.button>
            </Link>
            <Link to="/register">
              <motion.button
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/15 hover:bg-white/25 border border-white/50 text-white font-bold text-sm backdrop-blur-sm transition-all"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <FiUserPlus className="w-4 h-4" />
                Créer un compte
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* ── LUMI ROBOT (bottom right) ── */}
      <div className="absolute bottom-6 right-6 z-10 flex items-end gap-3">
        {/* Speech bubble */}
        <motion.div
          className="bg-white rounded-2xl px-4 py-2 text-slate-700 text-sm font-medium shadow-lg relative"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
        >
          Salut ! Je suis Lumi ! 👋
          <div className="absolute bottom-3 right-[-8px] w-4 h-4 bg-white rotate-45" />
        </motion.div>

        {/* Robot */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-900/50">
            <BsRobot className="text-white w-8 h-8" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
