import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const OBJECTIVE_LABEL = {
  comprehension: '📖 Compréhension',
  lexique:       '📝 Lexique',
  conjugaison:   '🔀 Conjugaison',
  grammaire:     '📐 Grammaire',
  orthographe:   '🔤 Orthographe',
  mixte:         '🌈 Mixte',
};

const DIFFICULTY_COLOR = {
  easy:   'bg-emerald-400/15 text-emerald-200 border border-emerald-300/25',
  medium: 'bg-yellow-400/15 text-yellow-200 border border-yellow-300/25',
  hard:   'bg-red-400/15 text-red-200 border border-red-300/25',
};
const DIFFICULTY_LABEL = { easy: '🟢 Facile', medium: '🟡 Moyen', hard: '🔴 Difficile' };

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null); // { levels: [], unlockedLevel }
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joinMsg, setJoinMsg] = useState('');

  const loadAssignments = () => {
    if (!user?.classId) { setLoading(false); return; }
    api.get('/assignments/student')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAssignments(); }, [user?.classId]);

  const joinClass = async () => {
    try {
      const res = await api.post('/classes/join', { joinCode });
      setJoinMsg('🎉 ' + res.data.message);
      setJoinCode('');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setJoinMsg('❌ ' + (err.response?.data?.message || 'Erreur'));
    }
  };

  const allAssignments = data?.levels.flatMap((l) => l.assignments) || [];
  const totalCompleted = allAssignments.filter((a) => a.progressState === 'completed').length;

  return (
    <div className="teacher-bg p-4 md:p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div className="flex items-start justify-between mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <h1 className="text-4xl md:text-5xl font-fredoka font-bold text-[var(--text-strong)] drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              Bonjour, {user.name} !
            </h1>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="inline-flex items-center gap-2 font-black px-4 py-2 rounded-full text-lg text-[#FCE9A6]"
                style={{ background: 'rgba(250,204,21,0.14)', border: '1px solid rgba(250,204,21,0.40)' }}>
                ⭐ {user.totalStars} étoiles
              </span>
              <span className="inline-flex items-center gap-2 font-black px-4 py-2 rounded-full text-lg text-[#C9BFF0]"
                style={{ background: 'rgba(142,128,242,0.14)', border: '1px solid rgba(157,140,246,0.35)' }}>
                🏆 Niveau {user.level}
              </span>
              {data && (
                <span className="inline-flex items-center gap-2 font-bold px-4 py-2 rounded-full text-sm text-[#86efac]"
                  style={{ background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.35)' }}>
                  {totalCompleted}/{allAssignments.length} terminés
                </span>
              )}
            </div>
          </div>
          <button onClick={logout} className="font-fredoka font-medium text-[#D7CFF2] px-4 py-2 rounded-full transition-all hover:brightness-110"
            style={{ background: 'rgba(26,20,46,0.6)', border: '1px solid rgba(180,165,225,0.22)' }}>
            Déconnexion
          </button>
        </motion.div>

        {/* Rejoindre une classe */}
        {!user.classId && (
          <motion.div className="card mb-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-[var(--text-strong)] font-fredoka font-semibold text-xl mb-4">
              🏫 Rejoins ta classe pour voir tes aventures !
            </p>
            <div className="flex gap-4">
              <input className="input-field flex-1 text-center font-black tracking-[0.4em] uppercase"
                placeholder="CODE" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={5} />
              <button onClick={joinClass} className="btn-primary whitespace-nowrap px-10">Rejoindre</button>
            </div>
            {joinMsg && <p className="mt-3 font-bold text-[#C9BFF0]">{joinMsg}</p>}
          </motion.div>
        )}

        {/* Titre section */}
        <h2 className="text-2xl font-fredoka font-semibold text-[var(--text-strong)] mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
          🗺️ Mon Parcours
        </h2>

        {/* États */}
        {loading ? (
          <div className="text-center py-12"><div className="text-5xl animate-bounce">📖</div></div>
        ) : !user.classId ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">😴</div>
            <p className="text-[var(--text-strong)] font-fredoka font-semibold text-2xl">Rejoins une classe d'abord !</p>
          </div>
        ) : !data || data.levels.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">😴</div>
            <p className="text-[var(--text-strong)] font-fredoka font-semibold text-2xl">Aucune aventure disponible</p>
            <p className="text-[var(--text-muted)] mt-2">Ton enseignant n'a pas encore assigné de défis !</p>
          </div>
        ) : (
          <div className="space-y-10">
            {data.levels.map((levelGroup, gi) => {
              const isLocked = levelGroup.level > data.unlockedLevel;
              return (
                <motion.div key={levelGroup.level}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.1 }}>

                  {/* En-tête du niveau */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="px-5 py-2 rounded-full font-fredoka font-bold text-lg"
                      style={isLocked
                        ? { background: 'rgba(26,20,46,0.55)', border: '1px solid rgba(150,132,206,0.18)', color: '#6B6490' }
                        : { background: 'linear-gradient(135deg,#8E80F2,#5E4FDD)', color: 'white', boxShadow: '0 6px 20px rgba(94,79,221,0.4)' }}>
                      {isLocked ? '🔒' : '⭐'} Niveau {levelGroup.level}
                    </div>
                    {isLocked && (
                      <span className="text-sm font-semibold text-[var(--text-muted)]">
                        Termine le niveau {levelGroup.level - 1} pour débloquer !
                      </span>
                    )}
                  </div>

                  {/* Grille des assignments */}
                  <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${isLocked ? 'select-none' : ''}`}>
                    {levelGroup.assignments.map((assignment, i) => (
                      <AssignmentCard key={assignment._id} assignment={assignment} isLocked={isLocked} index={i} />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AssignmentCard({ assignment, isLocked, index }) {
  const STATE = {
    not_started: { text: '▶️ Jouer !',        bg: 'linear-gradient(135deg,#8E80F2,#C45EE0)', shadow: '0 10px 26px rgba(124,77,224,0.40)' },
    attempted:   { text: '🔄 2e tentative !', bg: 'linear-gradient(135deg,#f59e0b,#d97706)', shadow: '0 10px 26px rgba(245,158,11,0.40)' },
    completed:   { text: '✅ Terminé',         bg: 'linear-gradient(135deg,#22c55e,#16a34a)', shadow: '0 10px 26px rgba(34,197,94,0.35)' },
  };
  const state = STATE[assignment.progressState] || STATE.not_started;

  const inner = (
    <motion.div className="card relative overflow-hidden transition-all cursor-pointer"
      style={{ border: assignment.progressState === 'completed' ? '2px solid rgba(52,211,153,0.55)' : '1px solid var(--panel-border)' }}
      whileHover={!isLocked ? { scale: 1.03, filter: 'brightness(1.07)' } : {}}
      whileTap={!isLocked ? { scale: 0.97 } : {}}
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.07 }}>

      {/* Overlay verrou */}
      {isLocked && (
        <div className="absolute inset-0 rounded-[28px] flex items-center justify-center z-10"
          style={{ background: 'rgba(12,8,28,0.65)' }}>
          <span className="text-5xl">🔒</span>
        </div>
      )}

      <div className="text-5xl mb-3 text-center">{assignment.story.coverEmoji}</div>
      <h3 className="font-fredoka font-bold text-[var(--text-strong)] text-center text-lg mb-2">{assignment.story.title}</h3>

      <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${DIFFICULTY_COLOR[assignment.story.difficulty]}`}>
          {DIFFICULTY_LABEL[assignment.story.difficulty]}
        </span>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(142,128,242,0.15)', border: '1px solid rgba(157,140,246,0.35)', color: '#C9BFF0' }}>
          {OBJECTIVE_LABEL[assignment.objective]}
        </span>
      </div>

      <div className="text-center mb-3">
        {assignment.progressState === 'not_started' ? (
          <span className="text-[var(--text-muted)] font-bold text-sm">🎯 Pas encore joué</span>
        ) : (
          <span className="text-2xl tracking-wide">
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} style={{ opacity: i < assignment.stars ? 1 : 0.2 }}>⭐</span>
            ))}
          </span>
        )}
      </div>

      <div className="text-white font-fredoka font-bold text-center py-2.5 rounded-2xl"
        style={{ background: state.bg, boxShadow: state.shadow }}>
        {state.text}
      </div>
    </motion.div>
  );

  if (isLocked) return inner;
  return <Link to={`/play/${assignment._id}`}>{inner}</Link>;
}
