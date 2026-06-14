import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function Confetti() {
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: ['#f97bf5', '#4f8ef7', '#fbbf24', '#22c55e', '#ef4444'][i % 5],
    delay: Math.random() * 1,
    size: 8 + Math.random() * 8,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div key={p.id} className="confetti absolute"
          style={{ left: p.left, top: '-20px', width: p.size, height: p.size, backgroundColor: p.color, borderRadius: '2px', animationDelay: `${p.delay}s` }} />
      ))}
    </div>
  );
}

const OBJECTIVE_LABEL = {
  comprehension: 'Compréhension', lexique: 'Lexique', conjugaison: 'Conjugaison',
  grammaire: 'Grammaire', orthographe: 'Orthographe', mixte: 'Mixte',
};

export default function StoryPlayer() {
  const { id: assignmentId } = useParams();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // phase : 'listen' | 'quiz' | 'result1' | 'result2' | 'alreadyDone'
  const [phase, setPhase] = useState('listen');
  const [isPlaying, setIsPlaying] = useState(false);
  const [listenCompleted, setListenCompleted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [attempt1Result, setAttempt1Result] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    api.get(`/assignments/${assignmentId}`)
      .then((res) => setAssignment(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  useEffect(() => {
    return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, []);

  const handleListen = () => {
    if (!('speechSynthesis' in window)) {
      alert('Désolé, ton navigateur ne supporte pas la lecture vocale.');
      return;
    }
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(assignment.story.narratedText);
    utterance.lang = 'fr-FR'; utterance.pitch = 1.1; utterance.rate = 0.9;
    utterance.onend = () => { setIsPlaying(false); setListenCompleted(true); };
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleAnswer = (val) => setAnswers((prev) => ({ ...prev, [currentQuestion]: val }));

  const handleOrderClick = (evtIndex) => {
    const order = answers[currentQuestion] || [];
    handleAnswer(order.includes(evtIndex) ? order.filter((i) => i !== evtIndex) : [...order, evtIndex]);
  };

  const isAnswerComplete = () => {
    if (!assignment) return false;
    const q = assignment.questions[currentQuestion];
    const ans = answers[currentQuestion];
    if (ans === undefined || ans === null) return false;
    if (q.type === 'order_events') return Array.isArray(ans) && ans.length === q.events.length;
    return true;
  };

  const submitAnswers = async () => {
    setSubmitting(true);
    const answersArray = assignment.questions.map((q, i) => ({
      questionIndex: i,
      selectedAnswer: answers[i] ?? (q.type === 'order_events' ? [] : q.type === 'true_false' ? null : -1),
    }));
    try {
      const res = await api.post(`/progress/${assignmentId}/submit`, { answers: answersArray, listenCompleted });
      if (res.data.attemptNumber === 1) {
        setAttempt1Result(res.data);
        setPhase('result1');
      } else {
        setFinalResult(res.data);
        setPhase('result2');
        if (res.data.stars >= 2) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3500);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (err.response?.status === 400 && msg.toLowerCase().includes('terminé')) {
        setPhase('alreadyDone');
      } else {
        setError(msg || 'Erreur lors de la soumission');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const retryFromListen = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setListenCompleted(false);
    setAttempt1Result(null);
    setPhase('listen');
  };

  const backTo = user?.role === 'teacher' ? '/teacher' : '/student';

  // ── États de chargement / erreur ──
  if (loading) return (
    <div className="min-h-screen teacher-bg flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl animate-bounce mb-4">📖</div>
        <p className="font-fredoka text-[var(--text-strong)] text-2xl">Chargement de l'aventure…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen teacher-bg flex items-center justify-center p-4">
      <div className="card text-center max-w-md">
        <div className="text-5xl mb-3">😢</div>
        <p className="font-fredoka font-bold text-[var(--text-strong)] text-xl">{error}</p>
        <Link to={backTo} className="btn-primary mt-4 inline-flex">← Retour</Link>
      </div>
    </div>
  );

  if (!assignment || assignment.status === 'processing') return (
    <div className="min-h-screen teacher-bg flex items-center justify-center p-4">
      <div className="card text-center max-w-md">
        <div className="text-5xl mb-3" style={{ display: 'inline-block', animation: 'spin 2s linear infinite' }}>⏳</div>
        <p className="font-fredoka font-bold text-[var(--text-strong)] text-xl">L'IA prépare les défis…</p>
        <p className="text-[var(--text-muted)] mt-2">Reviens dans quelques instants !</p>
        <Link to={backTo} className="btn-primary mt-4 inline-flex">← Retour</Link>
      </div>
    </div>
  );

  const questions = assignment.questions || [];
  const currentQ  = questions[currentQuestion];

  return (
    <div className="min-h-screen teacher-bg p-4">
      {showConfetti && <Confetti />}
      <div className="max-w-2xl mx-auto">

        <Link to={backTo} className="inline-flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-strong)] font-bold mb-4 transition-colors">
          ← Retour
        </Link>

        {/* Indicateur de phases (élève seulement) */}
        {user?.role === 'student' && !['alreadyDone'].includes(phase) && (
          <div className="flex gap-2 mb-6 justify-center">
            {[{ id: 'listen', label: '🎧 Écoute' }, { id: 'quiz', label: '🧠 Défis' }].map((p) => {
              const active = p.id === 'listen' ? phase === 'listen' : ['quiz', 'result1', 'result2'].includes(phase);
              return (
                <div key={p.id} className="px-4 py-2 rounded-full font-bold text-sm"
                  style={active
                    ? { background: 'linear-gradient(135deg,#8E80F2,#5E4FDD)', color: 'white' }
                    : { background: 'rgba(26,20,46,0.7)', border: '1px solid rgba(180,165,225,0.18)', color: 'var(--text-muted)' }}>
                  {p.label}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════════════════ ÉCOUTE ═══════════════════ */}
        {phase === 'listen' && (
          <motion.div className="card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-center mb-6">
              <div className="text-8xl mb-4">{assignment.story.coverEmoji || '📚'}</div>
              <h1 className="text-3xl font-fredoka font-bold text-[var(--text-strong)] mb-1">
                {assignment.story.title}
              </h1>
              <div className="flex items-center justify-center gap-3 mt-2 text-sm font-bold text-[var(--text-muted)]">
                <span>Niveau {assignment.level}</span>
                <span>·</span>
                <span>{OBJECTIVE_LABEL[assignment.objective]}</span>
              </div>
            </div>

            <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(18,14,36,0.55)', border: '1px solid rgba(150,132,206,0.22)' }}>
              <p className="text-[var(--text-soft)] font-semibold text-base leading-relaxed whitespace-pre-line">
                {assignment.story.narratedText}
              </p>
            </div>

            <motion.button onClick={handleListen} className="w-full btn-primary text-xl py-4 mb-4" whileTap={{ scale: 0.95 }}>
              {isPlaying ? '⏸ Arrêter la lecture' : '▶️ Écouter l\'histoire'}
            </motion.button>

            {/* Élève → bouton vers les défis */}
            {user?.role === 'student' && questions.length > 0 && (
              <motion.button onClick={() => setPhase('quiz')} className="w-full font-fredoka font-bold text-lg py-3 rounded-2xl transition-all" whileTap={{ scale: 0.95 }}
                style={{ background: 'rgba(52,211,153,0.14)', border: '2px solid rgba(52,211,153,0.45)', color: '#86efac' }}>
                🧠 Je suis prêt(e) — Relever les défis !
              </motion.button>
            )}

            {/* Prof → aperçu des questions avec bonnes réponses */}
            {user?.role === 'teacher' && questions.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="font-fredoka font-bold text-[var(--text-strong)] text-lg">🧪 Aperçu des défis</h3>
                {questions.map((q, i) => (
                  <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(18,14,36,0.45)', border: '1px solid rgba(150,132,206,0.22)' }}>
                    <p className="font-bold text-[var(--text-strong)] mb-2 text-sm">
                      {i + 1}. <span className="text-[#9D8CF6]">[{q.type}]</span> {q.question}
                    </p>
                    {q.options && (
                      <div className="flex flex-wrap gap-2 mb-1">
                        {q.options.map((opt, j) => (
                          <span key={j} className="text-xs px-2 py-1 rounded-full font-bold"
                            style={j === q.correctAnswer
                              ? { background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.35)', color: '#86efac' }
                              : { background: 'rgba(18,14,36,0.55)', border: '1px solid rgba(150,132,206,0.22)', color: 'var(--text-muted)' }}>
                            {j === q.correctAnswer ? '✓ ' : ''}{opt}
                          </span>
                        ))}
                      </div>
                    )}
                    {q.type === 'true_false' && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{ background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.35)', color: '#86efac' }}>
                        ✓ {q.correctAnswer ? 'Vrai' : 'Faux'}
                      </span>
                    )}
                    {q.type === 'order_events' && q.events && (
                      <p className="text-xs text-[var(--text-muted)]">
                        Ordre : {q.correctOrder?.map((idx) => q.events[idx]).join(' → ')}
                      </p>
                    )}
                    {q.explanation && <p className="text-xs text-[var(--text-muted)] mt-1 italic">💡 {q.explanation}</p>}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════ QUIZ ═══════════════════ */}
        {phase === 'quiz' && currentQ && (
          <motion.div className="card" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
            {/* Barre de progression */}
            <div className="mb-6">
              <div className="flex justify-between text-sm font-bold text-[var(--text-muted)] mb-2">
                <span>Défi {currentQuestion + 1} / {questions.length}</span>
                <span className="text-[#9D8CF6]">{OBJECTIVE_LABEL[assignment.objective]}</span>
              </div>
              <div className="w-full h-3 rounded-full" style={{ background: 'rgba(18,14,36,0.55)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%`, background: 'linear-gradient(90deg,#8E80F2,#C45EE0)' }} />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={currentQuestion} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div className="text-center text-4xl mb-4">
                  {{ true_false: '⚖️', fill_blank: '🔤', order_events: '⏳', odd_one_out: '🕵️', mcq: '🤔' }[currentQ.type] || '🤔'}
                </div>
                <h2 className="text-2xl font-fredoka font-black text-[var(--text-strong)] mb-8 text-center leading-tight">
                  {currentQ.question}
                </h2>

                <div className="space-y-3">
                  {/* VRAI / FAUX */}
                  {currentQ.type === 'true_false' && [true, false].map((val) => (
                    <button key={String(val)} onClick={() => handleAnswer(val)}
                      className="w-full py-4 rounded-2xl font-fredoka font-black text-xl transition-all"
                      style={answers[currentQuestion] === val
                        ? { border: '3px solid #8E80F2', background: 'rgba(142,128,242,0.18)', color: '#EDE7FB', boxShadow: '0 0 20px rgba(142,128,242,0.35)' }
                        : { border: '2px solid rgba(150,132,206,0.28)', background: 'rgba(18,14,36,0.45)', color: '#A99FCB' }}>
                      {val ? '👍 VRAI' : '👎 FAUX'}
                    </button>
                  ))}

                  {/* MCQ / FILL_BLANK / ODD_ONE_OUT */}
                  {['mcq', 'fill_blank', 'odd_one_out'].includes(currentQ.type) && currentQ.options?.map((opt, i) => (
                    <motion.button key={i} onClick={() => handleAnswer(i)} whileTap={{ scale: 0.97 }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-left transition-all"
                      style={answers[currentQuestion] === i
                        ? { border: '3px solid #8E80F2', background: 'rgba(142,128,242,0.18)', color: '#EDE7FB', boxShadow: '0 0 20px rgba(142,128,242,0.35)' }
                        : { border: '2px solid rgba(150,132,206,0.28)', background: 'rgba(18,14,36,0.45)', color: '#C5BBE4' }}>
                      <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm"
                        style={answers[currentQuestion] === i
                          ? { background: '#8E80F2', color: 'white' }
                          : { background: 'rgba(150,132,206,0.2)', color: '#9D8CF6' }}>
                        {['A', 'B', 'C', 'D'][i]}
                      </span>
                      <span className="text-base">{opt}</span>
                    </motion.button>
                  ))}

                  {/* ORDER_EVENTS */}
                  {currentQ.type === 'order_events' && currentQ.events?.map((evt, i) => {
                    const pos = (answers[currentQuestion] || []).indexOf(i);
                    const selected = pos !== -1;
                    return (
                      <motion.button key={i} onClick={() => handleOrderClick(i)} whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-left transition-all"
                        style={selected
                          ? { border: '3px solid #C45EE0', background: 'rgba(196,94,224,0.14)', color: '#EDE7FB' }
                          : { border: '2px solid rgba(150,132,206,0.28)', background: 'rgba(18,14,36,0.45)', color: '#C5BBE4' }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black text-xl"
                          style={selected
                            ? { background: '#C45EE0', color: 'white', boxShadow: '0 0 14px rgba(196,94,224,0.5)' }
                            : { border: '2px dashed rgba(150,132,206,0.4)', color: 'rgba(150,132,206,0.4)' }}>
                          {selected ? pos + 1 : '?'}
                        </div>
                        <span>{evt}</span>
                      </motion.button>
                    );
                  })}
                  {currentQ.type === 'order_events' && (
                    <p className="text-center text-sm font-bold animate-pulse" style={{ color: '#C45EE0' }}>
                      Touche les cases dans l'ordre de l'histoire !
                    </p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8">
              {currentQuestion < questions.length - 1 ? (
                <motion.button onClick={() => setCurrentQuestion((q) => q + 1)} disabled={!isAnswerComplete()} whileTap={{ scale: 0.95 }}
                  className="w-full py-4 rounded-2xl font-fredoka font-black text-xl text-white transition-all"
                  style={!isAnswerComplete()
                    ? { background: 'rgba(150,132,206,0.15)', color: '#6B6490', cursor: 'not-allowed' }
                    : { background: 'linear-gradient(135deg,#8E80F2,#5E4FDD)', boxShadow: '0 10px 26px rgba(94,79,221,0.45)' }}>
                  Défi Suivant ➡️
                </motion.button>
              ) : (
                <motion.button onClick={submitAnswers} disabled={!isAnswerComplete() || submitting} whileTap={{ scale: 0.95 }}
                  className="w-full py-4 rounded-2xl font-fredoka font-black text-xl text-white transition-all"
                  style={(!isAnswerComplete() || submitting)
                    ? { background: 'rgba(150,132,206,0.15)', color: '#6B6490', cursor: 'not-allowed' }
                    : { background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 10px 26px rgba(34,197,94,0.4)' }}>
                  {submitting ? '⏳ Correction en cours…' : '🏁 Terminer l\'Aventure !'}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════ RÉSULTAT TENTATIVE 1 ═══════════════════ */}
        {phase === 'result1' && attempt1Result && (
          <motion.div className="card text-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-7xl mb-3">🌟</div>
            <h2 className="text-3xl font-fredoka font-black text-[var(--text-strong)] mb-4">Première tentative !</h2>
            <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(142,128,242,0.14)', border: '1px solid rgba(157,140,246,0.35)' }}>
              <p className="text-[var(--text-strong)] font-fredoka font-bold text-xl">{attempt1Result.message}</p>
            </div>
            <p className="text-[var(--text-soft)] font-semibold mb-6">
              Réécoute bien l'histoire avant de tenter une 2e fois !
            </p>
            <motion.button onClick={retryFromListen} className="w-full btn-primary text-xl py-4" whileTap={{ scale: 0.95 }}>
              🔄 Réécouter et réessayer
            </motion.button>
          </motion.div>
        )}

        {/* ═══════════════════ RÉSULTAT FINAL ═══════════════════ */}
        {phase === 'result2' && finalResult && (
          <motion.div className="card" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-center mb-6">
              <div className="text-7xl mb-2">
                {finalResult.stars === 3 ? '🏆' : finalResult.stars >= 1 ? '🎉' : '💪'}
              </div>
              <h2 className="text-3xl font-fredoka font-black text-[var(--text-strong)] mb-3">
                {finalResult.stars === 3 ? 'Parfait !' : finalResult.stars >= 1 ? 'Bien joué !' : 'Continue !'}
              </h2>
              <div className="text-5xl mb-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <span key={i} style={{ opacity: i < finalResult.stars ? 1 : 0.25 }}>⭐</span>
                ))}
              </div>
              <p className="font-fredoka font-bold text-[var(--text-soft)] text-xl mb-1">
                {finalResult.score} / {finalResult.total} bonnes réponses
              </p>
              <p className="font-black text-[#9D8CF6] text-lg">+{finalResult.pointsEarned} pts</p>

              {finalResult.levelUp && (
                <motion.div className="mt-4 rounded-2xl p-4"
                  style={{ background: 'rgba(250,204,21,0.14)', border: '2px solid rgba(250,204,21,0.5)' }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}>
                  <p className="font-fredoka font-black text-yellow-300 text-xl">
                    🎊 Niveau {finalResult.newLevel} débloqué !
                  </p>
                </motion.div>
              )}
            </div>

            {/* Corrections */}
            <div className="space-y-3 mb-6">
              <h3 className="font-fredoka font-bold text-[var(--text-strong)] text-lg">📋 Corrections</h3>
              {finalResult.corrections.map((c) => {
                const q = questions[c.questionIndex];
                return (
                  <div key={c.questionIndex} className="rounded-2xl p-4"
                    style={c.isCorrect
                      ? { background: 'rgba(52,211,153,0.10)', border: '2px solid rgba(52,211,153,0.35)' }
                      : { background: 'rgba(239,68,68,0.10)', border: '2px solid rgba(239,68,68,0.35)' }}>
                    <p className="font-bold text-[var(--text-strong)] mb-2 text-sm">
                      {c.isCorrect ? '✅' : '❌'} {q?.question}
                    </p>
                    {!c.isCorrect && (
                      <p className="text-sm font-bold text-emerald-300">
                        Bonne réponse :{' '}
                        {q?.type === 'order_events'
                          ? c.correctOrder?.map((idx) => q.events?.[idx]).join(' → ')
                          : q?.type === 'true_false'
                            ? (c.correctAnswer ? 'Vrai' : 'Faux')
                            : q?.options?.[c.correctAnswer]}
                      </p>
                    )}
                    {c.explanation && (
                      <p className="text-xs text-[var(--text-muted)] mt-1 italic">💡 {c.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <Link to="/student" className="w-full btn-primary text-lg py-3 block text-center">
              🏠 Retour à mes aventures
            </Link>
          </motion.div>
        )}

        {/* ═══════════════════ DÉJÀ TERMINÉ ═══════════════════ */}
        {phase === 'alreadyDone' && (
          <motion.div className="card text-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-7xl mb-3">🏅</div>
            <h2 className="text-3xl font-fredoka font-black text-[var(--text-strong)] mb-3">
              Aventure terminée !
            </h2>
            <p className="text-[var(--text-soft)] font-semibold mb-6">
              Tu as déjà utilisé tes 2 tentatives. Consulte ton tableau de bord pour voir tes résultats !
            </p>
            <Link to="/student" className="btn-primary text-lg py-3 px-8 inline-flex">
              🏠 Retour
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
