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

  const difficultyColor = {
    easy:   'bg-emerald-400/15 text-emerald-200 border border-emerald-300/25',
    medium: 'bg-yellow-400/15 text-yellow-200 border border-yellow-300/25',
    hard:   'bg-red-400/15 text-red-200 border border-red-300/25',
  };
  const difficultyLabel = { easy: '🟢 Facile', medium: '🟡 Moyen', hard: '🔴 Difficile' };

  return (
    <div className="teacher-bg p-4 md:p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          className="flex items-start justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-fredoka font-bold text-[var(--text-strong)] drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              Bonjour, {user.name} !
            </h1>
            <span
              className="inline-flex items-center gap-2 mt-3 font-black px-4 py-2 rounded-full text-lg text-[#FCE9A6]"
              style={{ background: 'rgba(250,204,21,0.14)', border: '1px solid rgba(250,204,21,0.40)' }}
            >
              ⭐ {user.totalStars} étoiles
            </span>
          </div>
          <button
            onClick={logout}
            className="font-fredoka font-medium text-[#D7CFF2] px-4 py-2 rounded-full transition-all hover:brightness-110"
            style={{ background: 'rgba(26,20,46,0.6)', border: '1px solid rgba(180,165,225,0.22)' }}
          >
            Deconnexion 
          </button>
        </motion.div>

        {/* Join class section */}
        {!user.classId && (
          <motion.div
            className="card mb-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-[var(--text-strong)] font-fredoka font-semibold text-xl mb-4">
              🏫 Rejoins ta classe pour voir les histoires !
            </p>
            <div className="flex gap-4">
              <input
                className="input-field flex-1 text-center font-black tracking-[0.4em] uppercase"
                placeholder="CODE"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={5}
              />
              <button onClick={joinClass} className="btn-primary whitespace-nowrap px-10">
                Rejoindre
              </button>
            </div>
            {joinMsg && <p className="mt-3 font-bold text-[#C9BFF0]">{joinMsg}</p>}
          </motion.div>
        )}

        {/* Stories grid */}
        <h2 className="text-2xl font-fredoka font-semibold text-[var(--text-strong)] mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
          📚 Mes Aventures
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-5xl animate-bounce">📖</div>
          </div>
        ) : stories.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">😴</div>
            <p className="text-[var(--text-strong)] font-fredoka font-semibold text-2xl">Aucune histoire disponible</p>
            <p className="text-[var(--text-muted)] mt-2">Demande à ton enseignant de t'assigner des histoires !</p>
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
                      className="card relative overflow-hidden cursor-pointer transition-all hover:brightness-110"
                      style={{ border: completed ? '2px solid rgba(52,211,153,0.55)' : '1px solid var(--panel-border)' }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {completed && (
                        <div
                          className="absolute top-3 right-3 rounded-full p-1 text-sm"
                          style={{ background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.35)' }}
                        >
                          ✅
                        </div>
                      )}
                      <div className="text-5xl mb-3 text-center">{story.coverEmoji}</div>
                      <h3 className="font-fredoka font-bold text-[var(--text-strong)] text-center text-lg mb-2">{story.title}</h3>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${difficultyColor[story.difficulty]}`}>
                          {difficultyLabel[story.difficulty]}
                        </span>
                      </div>
                      {stars ? (
                        <div className="text-center text-2xl tracking-wide">{stars}</div>
                      ) : (
                        <div className="text-center text-[var(--text-muted)] font-bold text-sm">
                          🎯 Pas encore joué
                        </div>
                      )}
                      <div
                        className="mt-3 text-white font-fredoka font-bold text-center py-2.5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg,#8E80F2,#C45EE0)',
                          boxShadow: '0 10px 26px rgba(124,77,224,0.40), inset 0 1px 0 rgba(255,255,255,0.25)',
                        }}
                      >
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
