import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Confetti component
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
            left: p.left,
            top: '-20px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: '2px',
            animationDelay: `${p.delay}s`,
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
  const [phase, setPhase] = useState('listen'); // listen | quiz | results
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false); // Pour l'état de la voix du navigateur
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    api.get(`/stories/${id}`)
      .then((res) => setStory(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  // NOUVEAU : Fonction de lecture vocale gratuite du navigateur
  const handleListen = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        return;
      }

      window.speechSynthesis.cancel(); // Annule les anciennes lectures
      const textToRead = story.simplifiedText || story.originalText;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      
      utterance.lang = 'fr-FR'; 
      utterance.pitch = 1.1; 
      utterance.rate = 0.9; // Légèrement ralenti pour les enfants

      utterance.onend = () => {
        setIsPlaying(false);
        if (user.role === 'student') {
          api.post(`/progress/listen/${id}`).catch(console.error);
        }
      };

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    } else {
      alert("Désolé, ton navigateur ne supporte pas la lecture vocale.");
    }
  };

  // Arrêter l'audio si on quitte la page
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const handleAnswer = (optionIndex) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: optionIndex }));
  };

  const nextQuestion = () => {
    if (currentQuestion < story.questions.length - 1) {
      setCurrentQuestion((q) => q + 1);
    }
  };

  const submitQuiz = async () => {
    const answersArray = story.questions.map((_, i) => ({
      questionIndex: i,
      selectedAnswer: answers[i] ?? -1,
    }));
    try {
      const res = await api.post(`/progress/submit/${id}`, { answers: answersArray });
      setResults(res.data);
      setPhase('results');
      if (res.data.stars >= 2) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl animate-bounce mb-4">📖</div>
        <p className="font-fredoka text-blue-600 text-2xl">Chargement de l'aventure...</p>
      </div>
    </div>
  );

  if (!story) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card text-center">
        <p className="text-xl font-bold text-gray-600">Histoire introuvable 😢</p>
        <Link to={user.role === 'teacher' ? '/teacher' : '/student'} className="bg-blue-500 text-white px-4 py-2 rounded mt-4 inline-block">
          Retour
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      {showConfetti && <Confetti />}

      <Link
        to={user.role === 'teacher' ? '/teacher' : '/student'}
        className="inline-flex items-center text-white/70 hover:text-white font-bold mb-4 transition-colors"
      >
        ← Retour
      </Link>

      {/* NOUVEAU : Les onglets sont maintenant cliquables ! */}
      <div className="flex justify-center gap-3 mb-6">
        {['listen', 'quiz', 'results'].map((p, i) => (
          <div
            key={p}
            onClick={() => setPhase(p)} // Permet de cliquer sur "Défi" en haut
            className={`cursor-pointer flex items-center gap-1 px-4 py-2 rounded-full font-bold text-sm transition-all ${
              phase === p ? 'bg-white text-purple-900' : 'bg-white/20 text-white/60 hover:bg-white/30'
            }`}
          >
            {['🎧', '🧠', '🏆'][i]} {['Écoute', 'Défi', 'Résultats'][i]}
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto">
        {/* ====== LISTEN PHASE ====== */}
        {phase === 'listen' && (
          <motion.div
            className="card bg-white p-6 rounded-3xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center mb-6">
              <motion.div
                className="text-8xl mb-4"
                animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {story.coverEmoji || '📚'}
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{story.title}</h1>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 max-h-64 overflow-y-auto">
              <p className="text-gray-700 font-semibold text-lg leading-relaxed whitespace-pre-line">
                {story.simplifiedText || story.originalText}
              </p>
            </div>

            {/* NOUVEAU : Bouton audio natif du navigateur */}
            <motion.button
              onClick={handleListen}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-xl py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? '⏸ Arrêter la lecture' : '▶️ Écouter l\'histoire (Gratuit)'}
            </motion.button>

            {/* NOUVEAU : Bouton "Défi" accessible au professeur aussi */}
            {story.questions?.length > 0 && (
              <motion.button
                onClick={() => setPhase('quiz')}
                className="w-full bg-blue-100 text-blue-700 border-2 border-blue-300 font-bold text-lg py-3 rounded-2xl mt-4 hover:bg-blue-200 transition-all"
                whileTap={{ scale: 0.95 }}
              >
                {user.role === 'teacher' ? '👀 Tester le défi (Vue prof)' : '🧠 Relever le défi !'}
              </motion.button>
            )}
            
            {user.role === 'teacher' && (
              <div className="mt-4 bg-yellow-50 rounded-2xl p-4 border-2 border-yellow-200">
                <p className="font-bold text-yellow-700">👩‍🏫 Vue enseignant</p>
                <p className="text-gray-600 text-sm mt-1">{story.questions?.length} questions générées par Groq</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ====== QUIZ PHASE ====== */}
        {phase === 'quiz' && story.questions && (
          <motion.div
            className="card bg-white p-6 rounded-3xl"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="mb-6">
              <div className="flex justify-between text-sm font-bold text-gray-500 mb-2">
                <span>Question {currentQuestion + 1} / {story.questions.length}</span>
                <span>{Object.keys(answers).length} répondu(s)</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                  style={{ width: `${((currentQuestion + 1) / story.questions.length) * 100}%` }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                <h2 className="text-xl font-black text-gray-800 mb-6 text-center">
                  🤔 {story.questions[currentQuestion].question}
                </h2>

                <div className="space-y-3">
                  {story.questions[currentQuestion].options.map((opt, i) => {
                    const isSelected = answers[currentQuestion] === i;
                    const letters = ['A', 'B', 'C', 'D'];
                    return (
                      <motion.button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 font-bold text-left transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                        whileTap={{ scale: 0.97 }}
                      >
                        <span className={`text-xl font-black w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-white shadow-md text-blue-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {letters[i]}
                        </span>
                        <span className="text-gray-700">{opt}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-3 mt-6">
              {currentQuestion < story.questions.length - 1 ? (
                <motion.button
                  onClick={nextQuestion}
                  disabled={answers[currentQuestion] === undefined}
                  className={`w-full bg-purple-600 text-white font-bold py-3 rounded-2xl transition-all ${answers[currentQuestion] === undefined ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700 shadow-md'}`}
                  whileTap={{ scale: 0.95 }}
                >
                  Suivant →
                </motion.button>
              ) : (
                <motion.button
                  onClick={submitQuiz}
                  disabled={Object.keys(answers).length < story.questions.length}
                  className={`w-full bg-green-500 text-white font-bold py-3 rounded-2xl transition-all ${Object.keys(answers).length < story.questions.length ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600 shadow-lg'}`}
                  whileTap={{ scale: 0.95 }}
                >
                  🏁 Terminer le défi !
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* ====== RESULTS PHASE ====== */}
        {phase === 'results' && results && (
          <motion.div
            className="card bg-white p-6 rounded-3xl text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Score : {results.scorePercent}%</h2>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setPhase('listen'); setAnswers({}); setCurrentQuestion(0); setResults(null); }}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-2xl hover:bg-gray-200 transition-all"
              >
                🔄 Recommencer
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}