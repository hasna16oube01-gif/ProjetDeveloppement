import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [stories, setStories]   = useState([]);
  const [classes, setClasses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab]           = useState('stories');
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: '', difficulty: 'medium', coverEmoji: '📖' });
  const [file, setFile]         = useState(null);
  const [message, setMessage]   = useState('');
  const [className, setClassName] = useState('');
  const [assignModal, setAssignModal] = useState(null); // story en cours d'assignation
  const fileRef = useRef();
  const [emojiPage, setEmojiPage] = useState(0);
  const pollingRef = useRef();

  const EMOJIS = [
  // 📖 Histoire & Magie
  '📖', '🏰', '🐉', '⚡', '🧙‍♂️', '🧚‍♀️', '🦄', '🔮', '👑', '📜', '🗝️', '💎',
  
  // 🦁 Animaux & Créatures
  '🦁', '🦉', '🦊', '🐺', '🦅', '🐙', '🐢', '🦕', '🦈', '🦋', '🐝', '🐧',
  
  // 🌍 Nature & Éléments
  '🌊', '🌺', '🌈', '🔥', '🍄', '🌲', '🌙', '☀️', '❄️', '🌋', '🍁', '🍀',
  
  // 🚀 Aventure & Découverte
  '🚀', '🗺️', '🧭', '⛵', '🛸', '🤖', '🏕️', '🛡️', '⚔️', '🪐', '🌟', '🔭',
  
  // 🎨 Créativité & Apprentissage
  '🎨', '🧩', '🎭', '💡', '🔬', '📐', '📚', '🏆', '🎯', '🏅', '🥇', '🚀'
];

  // ── Chargement ────────────────────────────────────────────
  const loadStories = async () => {
    try {
      const res = await api.get('/stories/teacher');
      setStories(res.data);
    } catch (err) { console.error(err); }
  };

  const loadClasses = async () => {
    try {
      const res = await api.get('/classes/teacher');
      setClasses(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    Promise.all([loadStories(), loadClasses()]).finally(() => setLoading(false));
    pollingRef.current = setInterval(loadStories, 5000);
    return () => clearInterval(pollingRef.current);
  }, []);

  // ── Upload histoire ───────────────────────────────────────
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !form.title) return;
    setUploading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('storyFile', file);
      formData.append('title', form.title);
      formData.append('difficulty', form.difficulty);
      formData.append('coverEmoji', form.coverEmoji);
      await api.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('🎉 Histoire envoyée ! L\'IA la traite...');
      setShowUpload(false);
      setForm({ title: '', difficulty: 'medium', coverEmoji: '📖' });
      setFile(null);
      loadStories();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Erreur upload'));
    } finally {
      setUploading(false);
    }
  };

  // ── Créer classe ──────────────────────────────────────────
  const createClass = async () => {
    if (!className.trim()) return;
    try {
      await api.post('/classes', { name: className });
      setClassName('');
      loadClasses();
    } catch (err) { console.error(err); }
  };

  // ── Assigner histoire ─────────────────────────────────────
  const assignStory = async (storyId, studentIds, classIds) => {
    try {
      await api.post(`/stories/${storyId}/assign`, { studentIds, classIds });
      setMessage(' Histoire assignée avec succès !');
      setAssignModal(null);
      loadStories();
    } catch (err) {
      setMessage(' Erreur lors de l\'assignation');
    }
  };

  // ── Supprimer ─────────────────────────────────────────────
  const deleteStory = async (id) => {
    if (!confirm('Supprimer cette histoire ?')) return;
    await api.delete(`/stories/${id}`);
    loadStories();
  };

  // ── Badge statut ──────────────────────────────────────────
  const statusBadge = (status) => {
    const map = {
      processing: { label: '⏳ En traitement', cls: 'bg-yellow-400/15 text-yellow-200 border border-yellow-300/25' },
      ready:      { label: '✅ Prête',          cls: 'bg-emerald-400/15 text-emerald-200 border border-emerald-300/25' },
      error:      { label: '❌ Erreur',          cls: 'bg-red-400/15 text-red-200 border border-red-300/25' },
    };
    const s = map[status] || map.processing;
    return (
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.cls}`}>
        {s.label}
      </span>
    );
  };

  // Styles inline réutilisés
  const tabActive   = { background: 'linear-gradient(135deg,#8E80F2,#5E4FDD)', boxShadow: '0 10px 26px rgba(94,79,221,0.45), inset 0 1px 0 rgba(255,255,255,0.25)' };
  const tabInactive = { background: 'rgba(26,20,46,0.94)', border: '1px solid rgba(180,165,225,0.18)' };
  const chipBase    = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(180,165,225,0.18)' };
  const chipSel     = { background: 'rgba(157,140,246,0.16)', border: '2px solid #9D8CF6', boxShadow: '0 0 0 3px rgba(157,140,246,0.25), 0 0 22px rgba(157,140,246,0.45)' };

  if (loading) return (
    <div className="teacher-bg flex items-center justify-center">
      <div className="text-5xl animate-bounce">⏳</div>
    </div>
  );

  // ── Tous les élèves de toutes les classes ─────────────────
  const allStudents = classes.flatMap((c) =>
    c.students.map((s) => ({ ...s, className: c.name, classId: c._id }))
  );

  // ── Pagination des emojis ─────────────────────────────────
  const EMOJIS_PER_PAGE = 24; // 12 colonnes × 2 lignes
  const totalEmojiPages = Math.ceil(EMOJIS.length / EMOJIS_PER_PAGE);
  const visibleEmojis = EMOJIS.slice(
  emojiPage * EMOJIS_PER_PAGE,
  emojiPage * EMOJIS_PER_PAGE + EMOJIS_PER_PAGE
  );
  return (
    <div className="teacher-bg p-4 md:p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-fredoka font-bold text-[var(--text-strong)] flex items-center gap-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              👩‍🏫 Bonjour, {user.name} ! <span className="text-yellow-300/90">✨</span>
            </h1>
            <p className="text-[var(--text-soft)] font-semibold mt-1">
              {stories.length} histoire(s) · {classes.length} classe(s)
            </p>
          </div>
          <button
            onClick={logout}
            className="font-fredoka font-medium text-[#D7CFF2] px-4 py-2 rounded-full transition-all hover:brightness-110"
            style={{ background: 'rgba(26,20,46,0.6)', border: '1px solid rgba(180,165,225,0.22)' }}
          >
             Déconnexion
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          {[
            { id: 'stories', label: '📚 Histoires' },
            { id: 'classes', label: '👥 Classes' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`font-fredoka font-semibold px-6 py-2.5 rounded-full transition-all ${
                tab === t.id ? 'text-white' : 'text-[#CFC6EC]'
              }`}
              style={tab === t.id ? tabActive : tabInactive}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Message flash */}
        <AnimatePresence>
          {message && (
            <motion.div
              className="font-bold p-4 rounded-2xl mb-4 text-center text-[#E7E0FA]"
              style={{ background: 'rgba(142,128,242,0.14)', border: '1px solid rgba(157,140,246,0.35)' }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {message}
              <button
                onClick={() => setMessage('')}
                className="ml-3 text-[#B9AEE0] hover:text-white"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════
            ONGLET HISTOIRES
        ══════════════════════════════════ */}
        {tab === 'stories' && (
          <div>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="btn-primary mb-6"
            >
              ➕ Nouvelle histoire
            </button>

            {/* Formulaire upload */}
            <AnimatePresence>
              {showUpload && (
                <motion.div
                  className="card mb-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <h2 className="text-2xl font-fredoka font-semibold text-[var(--text-strong)] mb-5">
                     Uploader une histoire
                  </h2>
                  <form onSubmit={handleUpload} className="space-y-5">
                    <div>
                      <label className="block font-bold text-[#CFC6EC] mb-2">Titre</label>
                      <input
                        className="input-field"
                        placeholder="Ex : Le lion et la souris"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        required
                      />
                    </div>

                    <div>
  <label className="block font-bold text-[#CFC6EC] mb-2">
    Icône de couverture
  </label>

  <div className="flex items-center gap-2">
    {/* Flèche gauche */}
    <button
      type="button"
      onClick={() => setEmojiPage((p) => Math.max(0, p - 1))}
      disabled={emojiPage === 0}
      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-2xl text-[#D9D2F7] transition-all hover:brightness-125 disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ background: 'rgba(142,128,242,0.18)', border: '1px solid rgba(157,140,246,0.40)' }}
    >
      ‹
    </button>

    {/* Grille : 12 colonnes × 2 lignes max */}
    <div className="grid grid-cols-12 gap-2 flex-1">
      {visibleEmojis.map((em, i) => (
        <button
          key={emojiPage * EMOJIS_PER_PAGE + i}
          type="button"
          onClick={() => setForm({ ...form, coverEmoji: em })}
          className="text-2xl md:text-3xl rounded-2xl transition-all flex items-center justify-center aspect-square w-full"
          style={form.coverEmoji === em ? chipSel : chipBase}
        >
          {em}
        </button>
      ))}
    </div>

    {/* Flèche droite */}
    <button
      type="button"
      onClick={() => setEmojiPage((p) => Math.min(totalEmojiPages - 1, p + 1))}
      disabled={emojiPage >= totalEmojiPages - 1}
      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-2xl text-[#D9D2F7] transition-all hover:brightness-125 disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ background: 'rgba(142,128,242,0.18)', border: '1px solid rgba(157,140,246,0.40)' }}
    >
      ›
    </button>
  </div>

  {/* Points indicateurs de page */}
  <div className="flex justify-center gap-1.5 mt-3">
    {Array.from({ length: totalEmojiPages }).map((_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => setEmojiPage(i)}
        className="rounded-full transition-all"
        style={{
          width: i === emojiPage ? 22 : 8,
          height: 8,
          background: i === emojiPage ? '#9D8CF6' : 'rgba(180,165,225,0.30)',
        }}
      />
    ))}
  </div>
</div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block font-bold text-[#CFC6EC] mb-2">Difficulté</label>
                        <select
                          className="input-field"
                          value={form.difficulty}
                          onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                        >
                          <option value="easy">🟢 Facile</option>
                          <option value="medium">🟡 Moyen</option>
                          <option value="hard">🔴 Difficile</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-[#CFC6EC] mb-2">
                          Fichier texte (.txt)
                        </label>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="font-fredoka font-medium px-5 py-2.5 rounded-xl text-[#D9D2F7] transition-all hover:brightness-110 whitespace-nowrap"
                            style={{ background: 'rgba(142,128,242,0.18)', border: '1px solid rgba(157,140,246,0.40)' }}
                          >
                            Choisir un fichier
                          </button>
                          <span className="text-[var(--text-muted)] text-sm truncate">
                            {file ? file.name : "Aucun fichier n'a été sélectionné"}
                          </span>
                          <input
                            ref={fileRef}
                            type="file"
                            accept=".txt"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files[0])}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-1">
                      <motion.button
                        type="submit"
                        className="btn-primary flex-1"
                        disabled={uploading}
                        whileTap={{ scale: 0.95 }}
                      >
                        {uploading ? '🤖 L\'IA travaille...' : ' Envoyer à l\'IA'}
                      </motion.button>
                      <button
                        type="button"
                        onClick={() => setShowUpload(false)}
                        className="font-fredoka font-medium text-[#E7E0FA] px-7 rounded-2xl transition-all hover:brightness-110"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grille des histoires */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stories.length === 0 && (
                <div className="col-span-full card text-center py-12">
                  <img
                    src="/empty-book.png"
                    alt=""
                    className="w-44 mx-auto mb-3 drop-shadow-[0_0_25px_rgba(180,150,255,0.35)]"
                  />
                  <p className="text-[var(--text-strong)] font-fredoka font-semibold text-2xl">
                    Aucune histoire créée
                  </p>
                  <p className="text-[var(--text-muted)] mt-1">
                    Cliquez sur "Nouvelle histoire" pour commencer !
                  </p>
                </div>
              )}
              {stories.map((story) => {
                const assignedCount =
                  (story.assignedStudents?.length || 0) +
                  (story.assignedClasses?.length || 0);
                return (
                  <motion.div
                    key={story._id}
                    className="card hover:brightness-110 transition-all"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-4xl">{story.coverEmoji}</span>
                      {statusBadge(story.status)}
                    </div>
                    <h3 className="font-fredoka font-bold text-[var(--text-strong)] text-lg mb-1">{story.title}</h3>
                    <p className="text-[var(--text-muted)] text-sm font-semibold mb-1">
                      {new Date(story.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-[#A99CF2] text-sm font-bold mb-3">
                      👥 {assignedCount} assignation(s)
                    </p>

                    <div className="flex gap-3 flex-wrap items-center">
                      {story.status === 'ready' && (
                        <>
                          <a
                            href={`/story/${story._id}`}
                            className="text-[#A99CF2] font-bold text-sm hover:underline"
                          >
                            👁 Voir
                          </a>
                          <button
                            onClick={() => setAssignModal(story)}
                            className="text-emerald-300 font-bold text-sm hover:underline"
                          >
                            📤 Assigner
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteStory(story._id)}
                        className="text-red-300/80 font-bold text-sm hover:text-red-300 ml-auto"
                      >
                        🗑 Suppr.
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            ONGLET CLASSES
        ══════════════════════════════════ */}
        {tab === 'classes' && (
          <div>
            <div className="card mb-6">
              <h2 className="text-2xl font-fredoka font-semibold text-[var(--text-strong)] mb-5">➕ Créer une classe</h2>
              <div className="flex gap-4">
                <input
                  className="input-field flex-1"
                  placeholder="Ex : CP - Classe de Mme Martin"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createClass()}
                />
                <button onClick={createClass} className="btn-primary whitespace-nowrap px-8">
                  Créer
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {classes.map((cls) => (
                <div key={cls._id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-fredoka font-semibold text-[var(--text-strong)]">{cls.name}</h3>
                    <span
                      className="font-black px-3 py-1 rounded-full text-sm text-[#CFC6EC]"
                      style={{ background: 'rgba(142,128,242,0.16)', border: '1px solid rgba(157,140,246,0.35)' }}
                    >
                      Code : {cls.joinCode}
                    </span>
                  </div>
                  <p className="text-[var(--text-soft)] font-semibold mb-3">
                    👥 {cls.students.length} élève(s)
                  </p>
                  {cls.students.length > 0 && (
                    <div className="space-y-2">
                      {cls.students.map((s) => (
                        <div
                          key={s._id}
                          className="flex items-center gap-2 rounded-xl p-2"
                          style={{ background: 'rgba(18,14,36,0.45)', border: '1px solid rgba(150,132,206,0.18)' }}
                        >
                          <span>{s.avatar}</span>
                          <span className="font-bold text-[var(--text-strong)]">{s.name}</span>
                          <span className="ml-auto text-yellow-300 font-bold text-sm">
                            ⭐ {s.totalStars}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {classes.length === 0 && (
                <div className="col-span-full card text-center py-12">
                  <div className="text-6xl mb-3">🏫</div>
                  <p className="text-[var(--text-strong)] font-fredoka font-semibold text-2xl">Aucune classe créée</p>
                  <p className="text-[var(--text-muted)] mt-1">Créez votre première classe pour commencer !</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          MODAL D'ASSIGNATION
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {assignModal && (
          <motion.div
            className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setAssignModal(null)}
          >
            <motion.div
              className="rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
              style={{
                background: 'rgba(28,22,50,0.95)',
                backdropFilter: 'blur(16px) saturate(120%)',
                border: '1px solid rgba(173,156,224,0.22)',
              }}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
            >
              <AssignModal
                story={assignModal}
                classes={classes}
                allStudents={allStudents}
                onAssign={assignStory}
                onClose={() => setAssignModal(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Modal d'assignation ──────────────────────────────────────────────────────
function AssignModal({ story, classes, allStudents, onAssign, onClose }) {
  const [selectedStudents, setSelectedStudents] = useState(
    story.assignedStudents?.map((s) => s._id || s) || []
  );
  const [selectedClasses, setSelectedClasses] = useState(
    story.assignedClasses?.map((c) => c._id || c) || []
  );

  const toggleStudent = (id) =>
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  const toggleClass = (id) =>
    setSelectedClasses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const handleSubmit = () => {
    onAssign(story._id, selectedStudents, selectedClasses);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-fredoka font-semibold text-[var(--text-strong)]">
            📤 Assigner l'histoire
          </h2>
          <p className="text-[var(--text-soft)] font-semibold text-sm">
            {story.coverEmoji} {story.title}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-[#B9AEE0] hover:text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-xl transition-all"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          ✕
        </button>
      </div>

      {/* Assigner à des classes */}
      {classes.length > 0 && (
        <div className="mb-6">
          <h3 className="font-black text-[var(--text-strong)] mb-3">🏫 Assigner à une classe entière</h3>
          <div className="space-y-2">
            {classes.map((cls) => {
              const selected = selectedClasses.includes(cls._id);
              return (
                <button
                  key={cls._id}
                  onClick={() => toggleClass(cls._id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl font-bold text-left transition-all"
                  style={selected
                    ? { border: '2px solid #8E80F2', background: 'rgba(142,128,242,0.15)', color: '#E7E0FA' }
                    : { border: '2px solid rgba(150,132,206,0.22)', background: 'rgba(18,14,36,0.35)', color: '#C5BBE4' }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm"
                    style={selected
                      ? { background: '#8E80F2', border: '2px solid #8E80F2' }
                      : { border: '2px solid rgba(150,132,206,0.4)' }}
                  >
                    {selected && '✓'}
                  </span>
                  <span>{cls.name}</span>
                  <span className="ml-auto text-[var(--text-muted)] font-semibold text-sm">
                    {cls.students.length} élève(s)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Assigner à des élèves individuellement */}
      {allStudents.length > 0 && (
        <div className="mb-6">
          <h3 className="font-black text-[var(--text-strong)] mb-3">👤 Assigner à des élèves individuels</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {allStudents.map((student) => {
              const selected = selectedStudents.includes(student._id);
              return (
                <button
                  key={student._id}
                  onClick={() => toggleStudent(student._id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl font-bold text-left transition-all"
                  style={selected
                    ? { border: '2px solid #C58AF0', background: 'rgba(197,138,240,0.15)', color: '#F0E4FA' }
                    : { border: '2px solid rgba(150,132,206,0.22)', background: 'rgba(18,14,36,0.35)', color: '#C5BBE4' }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm"
                    style={selected
                      ? { background: '#C58AF0', border: '2px solid #C58AF0' }
                      : { border: '2px solid rgba(150,132,206,0.4)' }}
                  >
                    {selected && '✓'}
                  </span>
                  <span>{student.avatar}</span>
                  <span>{student.name}</span>
                  <span className="ml-auto text-[var(--text-muted)] font-semibold text-sm">
                    {student.className}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Aucun élève */}
      {classes.length === 0 && allStudents.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">😕</div>
          <p className="text-[var(--text-soft)] font-bold">Aucune classe ni élève disponible.</p>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Crée d'abord une classe dans l'onglet "Classes".
          </p>
        </div>
      )}

      {/* Résumé sélection */}
      {(selectedStudents.length > 0 || selectedClasses.length > 0) && (
        <div
          className="rounded-2xl p-3 mb-4 text-sm font-bold text-emerald-200"
          style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.30)' }}
        >
          ✅ {selectedClasses.length} classe(s) + {selectedStudents.length} élève(s) sélectionné(s)
        </div>
      )}

      {/* Boutons */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 font-fredoka font-medium text-[#E7E0FA] py-3 rounded-2xl transition-all hover:brightness-110"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}
        >
          Annuler
        </button>
        <motion.button
          onClick={handleSubmit}
          disabled={selectedStudents.length === 0 && selectedClasses.length === 0}
          className="flex-1 btn-primary"
          whileTap={{ scale: 0.95 }}
        >
          ✅ Confirmer l'assignation
        </motion.button>
      </div>
    </div>
  );
}
