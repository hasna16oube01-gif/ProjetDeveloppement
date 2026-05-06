import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const floatingEmojis = ['📚', '⭐', '🎯', '🏆', '🎨', '🦁', '🚀', '💡'];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Floating background emojis */}
      {floatingEmojis.map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl opacity-20 select-none pointer-events-none"
          style={{ left: `${10 + i * 12}%`, top: `${10 + (i % 3) * 25}%` }}
          animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
        >
          {emoji}
        </motion.div>
      ))}

      <motion.div
        className="text-center z-10 px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="text-8xl mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🎮
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-fredoka text-white mb-4 drop-shadow-lg">
          Jeux Sérieux
        </h1>
        <p className="text-xl md:text-2xl text-white/90 font-bold mb-2">
          Apprendre à lire, c'est une aventure ! 🚀
        </p>
        <p className="text-lg text-white/80 mb-10 max-w-md mx-auto">
          Des histoires magiques, des défis amusants et des récompenses pour les champions de la lecture !
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login">
            <motion.button
              className="bg-white text-blue-600 font-black text-xl py-4 px-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔑 Se connecter
            </motion.button>
          </Link>
          <Link to="/register">
            <motion.button
              className="bg-yellow-400 text-gray-800 font-black text-xl py-4 px-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ✨ Créer un compte
            </motion.button>
          </Link>
        </div>

        {/* Feature pills */}
        <motion.div
          className="mt-12 flex flex-wrap gap-3 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {['🎧 Narration audio', '🧠 IA intelligente', '⭐ Récompenses', '👩‍🏫 Pour les profs'].map((f) => (
            <span key={f} className="bg-white/30 backdrop-blur text-white font-bold px-4 py-2 rounded-full text-sm">
              {f}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
