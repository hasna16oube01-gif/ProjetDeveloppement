import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Composant Confettis
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
        <div
          key={p.id}
          className="confetti absolute"
          style={{
            left: p.left, top: '-20px', width: p.size, height: p.size,
            backgroundColor: p.color, borderRadius: '2px', animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function StoryPlayer() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [phase, setPhase] = useState('listen'); 
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    api.get(`/stories/${id}`)
      .then((res) => setStory(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  // Lecture Vocale via le navigateur
  const handleListen = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        return;
      }
      window.speechSynthesis.cancel();
      const textToRead = story.simplifiedText || story.originalText;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'fr-FR'; utterance.pitch = 1.1; utterance.rate = 0.9;
      utterance.onend = () => {
        setIsPlaying(false);
        if (user.role === 'student') api.post(`/progress/listen/${id}`).catch(console.error);
      };
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    } else {
      alert("Désolé, ton navigateur ne supporte pas la lecture vocale.");
    }
  };

  useEffect(() => {
    return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, []);

  // Gestion des réponses
  const handleAnswer = (val) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: val }));
  };

  // Gestion spécifique pour "Remettre dans l'ordre" (order_events)
  const handleOrderClick = (evtIndex) => {
    const currentOrder = answers[currentQuestion] || [];
    if (currentOrder.includes(evtIndex)) {
      handleAnswer(currentOrder.filter(idx => idx !== evtIndex));
    } else {
      handleAnswer([...currentOrder, evtIndex]);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < story.questions.length - 1) setCurrentQuestion((q) => q + 1);
  };

  // Vérifie si la question actuelle a une réponse complète pour activer le bouton "Suivant"
  const isAnswerComplete = () => {
    const q = story.questions[currentQuestion];
    const ans = answers[currentQuestion];
    if (ans === undefined) return false;
    if (q.type === 'order_events') return ans.length === q.events.length;
    return true;
  };

  const submitQuiz = async () => {
    const answersArray = story.questions.map((_, i) => ({
      questionIndex: i,
      selectedAnswer: answers[i] ?? (story.questions[i].type === 'order_events' ? [] : -1),
    }));
    try {
      const res = await api.post(`/progress/submit/${id}`, { answers: answersArray });
      setResults(res.data);
      setPhase('results');
      if (res.data.stars >= 2) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } catch (err) { console.error(err); }
  };

  // Formater les réponses pour l'écran de résultats
  const formatAnswerText = (qType, ans, optionsOrEvents) => {
    if (qType === 'true_false') return ans ? 'Vrai' : (ans === false ? 'Faux' : 'Non répondu');
    if (qType === 'order_events') {
      if (!ans || ans.length === 0) return 'Non répondu';
      return ans.map(idx => optionsOrEvents[idx]).join(' ➔ ');
    }
    if (ans === undefined || ans === -1) return 'Non répondu';
    return optionsOrEvents[ans];
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl animate-bounce mb-4">📖</div>
        <p className="font-fredoka text-blue-600 text-2xl">Chargement...</p>
      </div>
    </div>
  );

  if (!story) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card text-center">
        <p className="text-xl font-bold text-gray-600">Histoire introuvable 😢</p>
        <Link to="/" className="bg-blue-500 text-white px-4 py-2 rounded mt-4 inline-block">Retour</Link>
      </div>
    </div>
  );

  const currentQ = story.questions?.[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      {showConfetti && <Confetti />}

      <Link to={user.role === 'teacher' ? '/teacher' : '/student'} className="inline-flex items-center text-white/70 hover:text-white font-bold mb-4 transition-colors">
        ← Retour
      </Link>

      <div className="flex justify-center gap-3 mb-6">
        {['listen', 'quiz', 'results'].map((p, i) => (
          <div key={p} onClick={() => setPhase(p)} className={`cursor-pointer flex items-center gap-1 px-4 py-2 rounded-full font-bold text-sm transition-all ${phase === p ? 'bg-white text-purple-900' : 'bg-white/20 text-white/60 hover:bg-white/30'}`}>
            {['🎧', '🧠', '🏆'][i]} {['Écoute', 'Défi', 'Résultats'][i]}
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto">
        
        {/* ================= ÉCOUTE ================= */}
        {phase === 'listen' && (
          <motion.div className="card bg-white p-6 rounded-3xl" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-center mb-6">
              <div className="text-8xl mb-4">{story.coverEmoji || '📚'}</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{story.title}</h1>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
              <p className="text-gray-700 font-semibold text-lg leading-relaxed whitespace-pre-line">
                {story.simplifiedText || story.originalText}
              </p>
            </div>
            <motion.button onClick={handleListen} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-xl py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all" whileTap={{ scale: 0.95 }}>
              {isPlaying ? '⏸ Arrêter la lecture' : '▶️ Écouter l\'histoire'}
            </motion.button>
            {story.questions?.length > 0 && (
              <motion.button onClick={() => setPhase('quiz')} className="w-full bg-blue-100 text-blue-700 border-2 border-blue-300 font-bold text-lg py-3 rounded-2xl mt-4 hover:bg-blue-200 transition-all" whileTap={{ scale: 0.95 }}>
                {user.role === 'teacher' ? '👀 Tester les défis (Vue prof)' : '🧠 Relever les défis !'}
              </motion.button>
            )}
          </motion.div>
        )}

        {/* ================= DÉFIS (Nouveaux Types) ================= */}
        {phase === 'quiz' && currentQ && (
          <motion.div className="card bg-white p-6 rounded-3xl" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
            <div className="mb-6">
              <div className="flex justify-between text-sm font-bold text-gray-500 mb-2">
                <span>Défi {currentQuestion + 1} / {story.questions.length}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all" style={{ width: `${((currentQuestion + 1) / story.questions.length) * 100}%` }} />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={currentQuestion} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                
                {/* Icône selon le type */}
                <div className="text-center text-4xl mb-4">
                  {currentQ.type === 'true_false' && '⚖️'}
                  {currentQ.type === 'fill_blank' && '🔤'}
                  {currentQ.type === 'order_events' && '⏳'}
                  {currentQ.type === 'odd_one_out' && '🕵️'}
                  {currentQ.type === 'mcq' && '🤔'}
                </div>

                <h2 className="text-2xl font-black text-gray-800 mb-8 text-center leading-tight">
                  {currentQ.question}
                </h2>

                <div className="space-y-3">
                  {/* TYPE 1: VRAI OU FAUX */}
                  {currentQ.type === 'true_false' && (
                    <div className="flex gap-4">
                      <button onClick={() => handleAnswer(true)} className={`flex-1 py-4 rounded-2xl border-4 font-black text-xl transition-all ${answers[currentQuestion] === true ? 'border-green-500 bg-green-50 text-green-700 shadow-md' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>👍 VRAI</button>
                      <button onClick={() => handleAnswer(false)} className={`flex-1 py-4 rounded-2xl border-4 font-black text-xl transition-all ${answers[currentQuestion] === false ? 'border-red-500 bg-red-50 text-red-700 shadow-md' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>👎 FAUX</button>
                    </div>
                  )}

                  {/* TYPE 2: QCM, TEXTE À TROUS, L'INTRUS */}
                  {['mcq', 'fill_blank', 'odd_one_out'].includes(currentQ.type) && currentQ.options.map((opt, i) => (
                    <motion.button key={i} onClick={() => handleAnswer(i)} className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 font-bold text-left transition-all ${answers[currentQuestion] === i ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300 shadow-sm' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`} whileTap={{ scale: 0.97 }}>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black ${answers[currentQuestion] === i ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {['A', 'B', 'C', 'D'][i]}
                      </span>
                      <span className="text-gray-700 text-lg">{opt}</span>
                    </motion.button>
                  ))}

                  {/* TYPE 3: ORDRE CHRONOLOGIQUE */}
                  {currentQ.type === 'order_events' && currentQ.events.map((evt, i) => {
                    const orderPos = (answers[currentQuestion] || []).indexOf(i);
                    const isSelected = orderPos !== -1;
                    return (
                      <motion.button key={i} onClick={() => handleOrderClick(i)} className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 font-bold text-left transition-all ${isSelected ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300' : 'border-gray-200 hover:border-gray-400'}`} whileTap={{ scale: 0.97 }}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black text-xl transition-all ${isSelected ? 'bg-purple-600 text-white scale-110 shadow-md' : 'bg-gray-100 text-transparent border-2 border-dashed border-gray-300'}`}>
                          {isSelected ? orderPos + 1 : '?'}
                        </div>
                        <span className="text-gray-700">{evt}</span>
                      </motion.button>
                    );
                  })}
                  {currentQ.type === 'order_events' && (
                    <p className="text-center text-sm text-purple-600 font-bold mt-4 animate-pulse">
                      Touche les cases dans l'ordre de l'histoire !
                    </p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8">
              {currentQuestion < story.questions.length - 1 ? (
                <motion.button onClick={nextQuestion} disabled={!isAnswerComplete()} className={`w-full py-4 rounded-2xl font-black text-xl text-white transition-all ${!isAnswerComplete() ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'}`} whileTap={{ scale: 0.95 }}>
                  Défi Suivant ➡️
                </motion.button>
              ) : (
                <motion.button onClick={submitQuiz} disabled={!isAnswerComplete()} className={`w-full py-4 rounded-2xl font-black text-xl text-white transition-all ${!isAnswerComplete() ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 shadow-lg'}`} whileTap={{ scale: 0.95 }}>
                  🏁 Terminer l'Aventure !
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* ================= RÉSULTATS ================= */}
        {phase === 'results' && results && (
          <motion.div className="card bg-white p-6 rounded-3xl text-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-7xl mb-2">{results.stars === 3 ? '🏆' : results.stars >= 1 ? '🎉' : '💪'}</div>
            <h2 className="text-3xl font-black text-gray-800 mb-2">{results.stars === 3 ? 'Parfait !' : 'Continue !'}</h2>
            <div className="text-5xl mb-4">
              {Array.from({ length: 3 }, (_, i) => (<span key={i} className={i < results.stars ? 'text-yellow-400' : 'text-gray-200'}>⭐</span>))}
            </div>
            <p className="text-2xl font-black text-purple-600 mb-6">{results.scorePercent}% de réussite</p>

            <div className="space-y-4 text-left mb-6">
              {results.results.map((r, i) => (
                <div key={i} className={`rounded-2xl p-4 border-4 ${r.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className="font-black text-gray-800 mb-2">{r.isCorrect ? '✅' : '❌'} {r.question}</p>
                  <p className="text-sm font-bold text-gray-600">
                    Ta réponse : <span className={r.isCorrect ? 'text-green-600' : 'text-red-600'}>
                      {formatAnswerText(r.type, r.userAnswer, r.type === 'order_events' ? r.events : r.options)}
                    </span>
                  </p>
                  {!r.isCorrect && (
                    <p className="text-sm font-bold text-green-700 mt-1">
                      La bonne réponse : {formatAnswerText(r.type, r.type === 'order_events' ? r.correctOrder : r.correctAnswer, r.type === 'order_events' ? r.events : r.options)}
                    </p>
                  )}
                  {r.explanation && <p className="text-xs text-gray-500 mt-2 italic">💡 {r.explanation}</p>}
                </div>
              ))}
            </div>

            <button onClick={() => { setPhase('listen'); setAnswers({}); setCurrentQuestion(0); setResults(null); }} className="w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all text-lg">
              🔄 Rejouer l'aventure
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}