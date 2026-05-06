import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joinMsg, setJoinMsg] = useState('');

  useEffect(() => {
    api.get('/stories/student')
      .then((res) => setStories(res.data))
      .finally(() => setLoading(false));
  }, []);

  const joinClass = async () => {
    try {
      const res = await api.post('/classes/join', { joinCode });
      setJoinMsg('🎉 ' + res.data.message);
      setJoinCode('');
      
      // 1. Recharger les histoires immédiatement pour les afficher
      const storiesRes = await api.get('/stories/student');
      setStories(storiesRes.data);

      // 2. Recharger la page après 1 seconde pour cacher la case du code 
      // et mettre à jour le contexte utilisateur (user.classId)
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      setJoinMsg('❌ ' + (err.response?.data?.message || 'Erreur'));
    }
  };
  const getStars = (progress) => {
    if (!progress?.completed) return null;
    return '⭐'.repeat(progress.stars) + '☆'.repeat(3 - progress.stars);
  };

  const difficultyColor = { easy: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', hard: 'bg-red-100 text-red-700' };
  const difficultyLabel = { easy: '🟢 Facile', medium: '🟡 Moyen', hard: '🔴 Difficile' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-7xl mb-2">{user.avatar}</div>
          <h1 className="text-4xl font-fredoka text-purple-700">
            Bonjour, {user.name} !
          </h1>
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="bg-yellow-100 text-yellow-700 font-black px-4 py-2 rounded-full text-lg">
              ⭐ {user.totalStars} étoiles
            </span>
            <button onClick={logout} className="text-gray-400 hover:text-red-400 font-bold text-sm transition-colors">
              🚪 Sortir
            </button>
          </div>
        </motion.div>

        {/* Join class section */}
        {!user.classId && (
          <motion.div
            className="card mb-6 border-2 border-dashed border-purple-200 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-gray-600 font-bold mb-3">🏫 Rejoins ta classe pour voir les histoires !</p>
            <div className="flex gap-3 max-w-xs mx-auto">
              <input
                className="input-field text-center font-black tracking-widest uppercase"
                placeholder="CODE"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={5}
              />
              <button onClick={joinClass} className="btn-secondary whitespace-nowrap">
                Rejoindre
              </button>
            </div>
            {joinMsg && <p className="mt-3 font-bold text-purple-600">{joinMsg}</p>}
          </motion.div>
        )}

        {/* Stories grid */}
        <h2 className="text-2xl font-fredoka text-gray-700 mb-4">📚 Mes Aventures</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-5xl animate-bounce">📖</div>
          </div>
        ) : stories.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">😴</div>
            <p className="text-gray-400 font-bold text-xl">Aucune histoire disponible</p>
            <p className="text-gray-400 mt-2">Demande à ton enseignant de t'assigner des histoires !</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story, i) => {
              const completed = story.progress?.completed;
              const stars = getStars(story.progress);
              return (
                <motion.div
                  key={story._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link to={`/story/${story._id}`}>
                    <motion.div
                      className={`card relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all ${
                        completed ? 'border-2 border-green-300' : 'border-2 border-transparent'
                      }`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {completed && (
                        <div className="absolute top-2 right-2 bg-green-100 rounded-full p-1">
                          ✅
                        </div>
                      )}
                      <div className="text-5xl mb-3 text-center">{story.coverEmoji}</div>
                      <h3 className="font-black text-gray-800 text-center text-lg mb-2">{story.title}</h3>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${difficultyColor[story.difficulty]}`}>
                          {difficultyLabel[story.difficulty]}
                        </span>
                      </div>
                      {stars ? (
                        <div className="text-center text-2xl">{stars}</div>
                      ) : (
                        <div className="text-center text-gray-400 font-bold text-sm">
                          🎯 Pas encore joué
                        </div>
                      )}
                      <div className="mt-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-center py-2 rounded-2xl">
                        {completed ? '🔄 Rejouer' : '▶️ Jouer !'}
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
