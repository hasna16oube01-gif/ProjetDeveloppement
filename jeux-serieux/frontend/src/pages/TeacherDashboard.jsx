import { useState, useEffect, useRef } from 'react';
import Avatar from '../components/shared/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const OBJECTIVES = ['comprehension', 'lexique', 'conjugaison', 'grammaire', 'orthographe', 'mixte'];
const OBJECTIVE_LABEL = {
  comprehension: '📖 Compréhension', lexique: '📝 Lexique', conjugaison: '🔀 Conjugaison',
  grammaire: '📐 Grammaire', orthographe: '🔤 Orthographe', mixte: '🌈 Mixte',
};

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [stories, setStories]     = useState([]);
  const [classes, setClasses]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab]             = useState('stories');
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm]   = useState({ title: '', difficulty: 'medium', coverEmoji: '📖' });
  const [file, setFile]   = useState(null);
  const [message, setMessage] = useState('');
  const [className, setClassName] = useState('');
  const [emojiPage, setEmojiPage] = useState(0);
  const fileRef    = useRef();
  const pollingRef = useRef();

  // Modal assignation → devient AssignmentModal
  const [assignModal, setAssignModal] = useState(null); // story sélectionnée

  // Assignments par classe (tab classes)
  const [classAssignments, setClassAssignments] = useState({}); // { classId: [] }
  const [expandedClass, setExpandedClass]       = useState(null);

  // Preview histoire (modal narratedText)
  const [previewStory, setPreviewStory] = useState(null);

  // Aperçu des défis d'un assignment
  const [previewAssignment, setPreviewAssignment] = useState(null);

  // Dashboard prof
  const [dashClassId, setDashClassId]     = useState('');
  const [overview, setOverview]           = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [radarStudent, setRadarStudent]   = useState(null); // { _id, name, avatar }
  const [radarData, setRadarData]         = useState([]);
  const [radarLoading, setRadarLoading]   = useState(false);

  const EMOJIS = [
    '📖', '🏰', '🐉', '⚡', '🧙‍♂️', '🧚‍♀️', '🦄', '🔮', '👑', '📜', '🗝️', '💎',
    '🦁', '🦉', '🦊', '🐺', '🦅', '🐙', '🐢', '🦕', '🦈', '🦋', '🐝', '🐧',
    '🌊', '🌺', '🌈', '🔥', '🍄', '🌲', '🌙', '☀️', '❄️', '🌋', '🍁', '🍀',
    '🚀', '🗺️', '🧭', '⛵', '🛸', '🤖', '🏕️', '🛡️', '⚔️', '🪐', '🌟', '🔭',
    '🎨', '🧩', '🎭', '💡', '🔬', '📐', '📚', '🏆', '🎯', '🏅', '🥇', '🚀',
  ];
  const EMOJIS_PER_PAGE = 24;
  const totalEmojiPages = Math.ceil(EMOJIS.length / EMOJIS_PER_PAGE);
  const visibleEmojis   = EMOJIS.slice(emojiPage * EMOJIS_PER_PAGE, emojiPage * EMOJIS_PER_PAGE + EMOJIS_PER_PAGE);

  // ── Chargement initial ────────────────────────────────────
  const loadStories = async () => {
    try { const res = await api.get('/stories/teacher'); setStories(res.data); } catch (e) { console.error(e); }
  };
  const loadClasses = async () => {
    try { const res = await api.get('/classes/teacher'); setClasses(res.data); } catch (e) { console.error(e); }
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
    setUploading(true); setMessage('');
    try {
      const fd = new FormData();
      fd.append('storyFile', file); fd.append('title', form.title);
      fd.append('difficulty', form.difficulty); fd.append('coverEmoji', form.coverEmoji);
      await api.post('/stories', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage("🎉 Histoire envoyée ! L'IA la traite…");
      setShowUpload(false); setForm({ title: '', difficulty: 'medium', coverEmoji: '📖' }); setFile(null);
      loadStories();
    } catch (err) { setMessage('❌ ' + (err.response?.data?.message || 'Erreur upload')); }
    finally { setUploading(false); }
  };

  // ── Créer classe ──────────────────────────────────────────
  const createClass = async () => {
    if (!className.trim()) return;
    try { await api.post('/classes', { name: className }); setClassName(''); loadClasses(); }
    catch (e) { console.error(e); }
  };

  // ── Supprimer histoire ────────────────────────────────────
  const deleteStory = async (id) => {
    if (!confirm('Supprimer cette histoire ?')) return;
    await api.delete(`/stories/${id}`); loadStories();
  };

  // ── Prévisualiser histoire ────────────────────────────────
  const openPreview = async (story) => {
    try {
      const res = await api.get(`/stories/${story._id}`);
      setPreviewStory(res.data);
    } catch (e) { console.error(e); }
  };

  // ── Prévisualiser les défis d'un assignment ───────────────
  const openAssignmentPreview = async (assignmentId) => {
    try {
      const res = await api.get(`/assignments/${assignmentId}`);
      setPreviewAssignment(res.data);
    } catch (e) { console.error(e); }
  };

  // ── Charger assignments d'une classe ─────────────────────
  const loadClassAssignments = async (classId) => {
    if (expandedClass === classId) { setExpandedClass(null); return; }
    setExpandedClass(classId);
    if (classAssignments[classId]) return; // déjà chargé
    try {
      const res = await api.get(`/assignments/class/${classId}`);
      setClassAssignments((prev) => ({ ...prev, [classId]: res.data }));
    } catch (e) { console.error(e); }
  };

  const deleteAssignment = async (classId, assignmentId) => {
    if (!confirm('Supprimer cet assignment et toutes les progressions ?')) return;
    await api.delete(`/assignments/${assignmentId}`);
    setClassAssignments((prev) => ({
      ...prev,
      [classId]: prev[classId]?.filter((a) => a._id !== assignmentId),
    }));
  };

  // ── Dashboard : overview ──────────────────────────────────
  useEffect(() => {
    if (!dashClassId) return;
    setOverview([]); setRadarStudent(null); setOverviewLoading(true);
    api.get(`/dashboard/class/${dashClassId}/overview`)
      .then((res) => setOverview(res.data))
      .catch(console.error)
      .finally(() => setOverviewLoading(false));
  }, [dashClassId]);

  // ── Dashboard : radar ─────────────────────────────────────
  const openRadar = (student) => {
    setRadarStudent(student); setRadarData([]); setRadarLoading(true);
    api.get(`/dashboard/student/${student._id}/radar`)
      .then((res) => setRadarData(res.data.map((d) => ({
        subject: OBJECTIVE_LABEL[d.objective] || d.objective,
        value: d.averageScore, fullMark: 100,
      }))))
      .catch(console.error)
      .finally(() => setRadarLoading(false));
  };

  // ── Styles partagés ───────────────────────────────────────
  const tabActive   = { background: 'linear-gradient(135deg,#8E80F2,#5E4FDD)', boxShadow: '0 10px 26px rgba(94,79,221,0.45), inset 0 1px 0 rgba(255,255,255,0.25)' };
  const tabInactive = { background: 'rgba(26,20,46,0.94)', border: '1px solid rgba(180,165,225,0.18)' };
  const chipBase    = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(180,165,225,0.18)' };
  const chipSel     = { background: 'rgba(157,140,246,0.16)', border: '2px solid #9D8CF6', boxShadow: '0 0 0 3px rgba(157,140,246,0.25), 0 0 22px rgba(157,140,246,0.45)' };

  const statusBadge = (status) => {
    const map = {
      processing: { label: '⏳ En cours', cls: 'bg-yellow-400/15 text-yellow-200 border border-yellow-300/25' },
      ready:      { label: '✅ Prête',     cls: 'bg-emerald-400/15 text-emerald-200 border border-emerald-300/25' },
      error:      { label: '❌ Erreur',    cls: 'bg-red-400/15 text-red-200 border border-red-300/25' },
    };
    const s = map[status] || map.processing;
    return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
  };

  if (loading) return (
    <div className="teacher-bg flex items-center justify-center min-h-screen">
      <div className="text-5xl animate-bounce">⏳</div>
    </div>
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
          <button onClick={logout} className="font-fredoka font-medium text-[#D7CFF2] px-4 py-2 rounded-full transition-all hover:brightness-110"
            style={{ background: 'rgba(26,20,46,0.6)', border: '1px solid rgba(180,165,225,0.22)' }}>
            Déconnexion
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {[
            { id: 'stories', label: '📚 Histoires' },
            { id: 'classes', label: '👥 Classes' },
            { id: 'dashboard', label: '📊 Tableau de bord' },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`font-fredoka font-semibold px-6 py-2.5 rounded-full transition-all ${tab === t.id ? 'text-white' : 'text-[#CFC6EC]'}`}
              style={tab === t.id ? tabActive : tabInactive}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Message flash */}
        <AnimatePresence>
          {message && (
            <motion.div className="font-bold p-4 rounded-2xl mb-4 text-center text-[#E7E0FA]"
              style={{ background: 'rgba(142,128,242,0.14)', border: '1px solid rgba(157,140,246,0.35)' }}
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {message}
              <button onClick={() => setMessage('')} className="ml-3 text-[#B9AEE0] hover:text-white">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════ ONGLET HISTOIRES ══════════ */}
        {tab === 'stories' && (
          <div>
            <button onClick={() => setShowUpload(!showUpload)} className="btn-primary mb-6">
              ➕ Nouvelle histoire
            </button>

            {/* Formulaire upload */}
            <AnimatePresence>
              {showUpload && (
                <motion.div className="card mb-6" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <h2 className="text-2xl font-fredoka font-semibold text-[var(--text-strong)] mb-5">Uploader une histoire</h2>
                  <form onSubmit={handleUpload} className="space-y-5">
                    <div>
                      <label className="block font-bold text-[#CFC6EC] mb-2">Titre</label>
                      <input className="input-field" placeholder="Ex : Le lion et la souris"
                        value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                    </div>

                    {/* Sélecteur emojis */}
                    <div>
                      <label className="block font-bold text-[#CFC6EC] mb-2">Icône de couverture</label>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setEmojiPage((p) => Math.max(0, p - 1))} disabled={emojiPage === 0}
                          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-2xl text-[#D9D2F7] transition-all hover:brightness-125 disabled:opacity-30"
                          style={{ background: 'rgba(142,128,242,0.18)', border: '1px solid rgba(157,140,246,0.40)' }}>‹</button>
                        <div className="grid grid-cols-12 gap-2 flex-1">
                          {visibleEmojis.map((em, i) => (
                            <button key={emojiPage * EMOJIS_PER_PAGE + i} type="button" onClick={() => setForm({ ...form, coverEmoji: em })}
                              className="text-2xl md:text-3xl rounded-2xl transition-all flex items-center justify-center aspect-square w-full"
                              style={form.coverEmoji === em ? chipSel : chipBase}>{em}</button>
                          ))}
                        </div>
                        <button type="button" onClick={() => setEmojiPage((p) => Math.min(totalEmojiPages - 1, p + 1))} disabled={emojiPage >= totalEmojiPages - 1}
                          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-2xl text-[#D9D2F7] transition-all hover:brightness-125 disabled:opacity-30"
                          style={{ background: 'rgba(142,128,242,0.18)', border: '1px solid rgba(157,140,246,0.40)' }}>›</button>
                      </div>
                      <div className="flex justify-center gap-1.5 mt-3">
                        {Array.from({ length: totalEmojiPages }).map((_, i) => (
                          <button key={i} type="button" onClick={() => setEmojiPage(i)} className="rounded-full transition-all"
                            style={{ width: i === emojiPage ? 22 : 8, height: 8, background: i === emojiPage ? '#9D8CF6' : 'rgba(180,165,225,0.30)' }} />
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block font-bold text-[#CFC6EC] mb-2">Difficulté</label>
                        <select className="input-field" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                          <option value="easy">🟢 Facile</option>
                          <option value="medium">🟡 Moyen</option>
                          <option value="hard">🔴 Difficile</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-[#CFC6EC] mb-2">Fichier texte (.txt)</label>
                        <div className="flex items-center gap-4">
                          <button type="button" onClick={() => fileRef.current?.click()}
                            className="font-fredoka font-medium px-5 py-2.5 rounded-xl text-[#D9D2F7] transition-all hover:brightness-110 whitespace-nowrap"
                            style={{ background: 'rgba(142,128,242,0.18)', border: '1px solid rgba(157,140,246,0.40)' }}>
                            Choisir un fichier
                          </button>
                          <span className="text-[var(--text-muted)] text-sm truncate">{file ? file.name : "Aucun fichier"}</span>
                          <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={(e) => setFile(e.target.files[0])} required />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-1">
                      <motion.button type="submit" className="btn-primary flex-1" disabled={uploading} whileTap={{ scale: 0.95 }}>
                        {uploading ? "🤖 L'IA travaille…" : "Envoyer à l'IA"}
                      </motion.button>
                      <button type="button" onClick={() => setShowUpload(false)}
                        className="font-fredoka font-medium text-[#E7E0FA] px-7 rounded-2xl transition-all hover:brightness-110"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}>
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
                  <p className="text-[var(--text-strong)] font-fredoka font-semibold text-2xl">Aucune histoire créée</p>
                  <p className="text-[var(--text-muted)] mt-1">Cliquez sur "Nouvelle histoire" pour commencer !</p>
                </div>
              )}
              {stories.map((story) => (
                <motion.div key={story._id} className="card hover:brightness-110 transition-all"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{story.coverEmoji}</span>
                    {statusBadge(story.status)}
                  </div>
                  <h3 className="font-fredoka font-bold text-[var(--text-strong)] text-lg mb-1">{story.title}</h3>
                  <p className="text-[var(--text-muted)] text-sm font-semibold mb-3">
                    {new Date(story.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                  <div className="flex gap-3 flex-wrap items-center">
                    {story.status === 'ready' && (
                      <>
                        <button onClick={() => openPreview(story)} className="text-[#A99CF2] font-bold text-sm hover:underline">
                          👁 Voir
                        </button>
                        <button onClick={() => setAssignModal(story)} className="text-emerald-300 font-bold text-sm hover:underline">
                          📤 Assigner
                        </button>
                      </>
                    )}
                    <button onClick={() => deleteStory(story._id)} className="text-red-300/80 font-bold text-sm hover:text-red-300 ml-auto">
                      🗑 Suppr.
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════ ONGLET CLASSES ══════════ */}
        {tab === 'classes' && (
          <div>
            <div className="card mb-6">
              <h2 className="text-2xl font-fredoka font-semibold text-[var(--text-strong)] mb-5">➕ Créer une classe</h2>
              <div className="flex gap-4">
                <input className="input-field flex-1" placeholder="Ex : CP - Classe de Mme Martin"
                  value={className} onChange={(e) => setClassName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createClass()} />
                <button onClick={createClass} className="btn-primary whitespace-nowrap px-8">Créer</button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {classes.map((cls) => (
                <div key={cls._id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-fredoka font-semibold text-[var(--text-strong)]">{cls.name}</h3>
                    <span className="font-black px-3 py-1 rounded-full text-sm text-[#CFC6EC]"
                      style={{ background: 'rgba(142,128,242,0.16)', border: '1px solid rgba(157,140,246,0.35)' }}>
                      Code : {cls.joinCode}
                    </span>
                  </div>
                  <p className="text-[var(--text-soft)] font-semibold mb-3">👥 {cls.students.length} élève(s)</p>
                  {cls.students.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {cls.students.map((s) => (
                        <div key={s._id} className="flex items-center gap-2 rounded-xl p-2"
                          style={{ background: 'rgba(18,14,36,0.45)', border: '1px solid rgba(150,132,206,0.18)' }}>
                          <Avatar src={s.avatar} size={32} />
                          <span className="font-bold text-[var(--text-strong)]">{s.name}</span>
                          <span className="ml-auto text-yellow-300 font-bold text-sm">⭐ {s.totalStars}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section assignments de la classe */}
                  <button onClick={() => loadClassAssignments(cls._id)}
                    className="w-full font-fredoka font-semibold py-2 rounded-2xl text-sm transition-all hover:brightness-110"
                    style={{ background: 'rgba(142,128,242,0.14)', border: '1px solid rgba(157,140,246,0.35)', color: '#C9BFF0' }}>
                    {expandedClass === cls._id ? '▲ Masquer les assignments' : '📋 Voir les assignments'}
                  </button>

                  <AnimatePresence>
                    {expandedClass === cls._id && (
                      <motion.div className="mt-3 space-y-2" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        {!classAssignments[cls._id] ? (
                          <p className="text-center text-[var(--text-muted)] text-sm py-2">Chargement…</p>
                        ) : classAssignments[cls._id].length === 0 ? (
                          <p className="text-center text-[var(--text-muted)] text-sm py-2">Aucun assignment pour cette classe.</p>
                        ) : classAssignments[cls._id].map((a) => (
                          <div key={a._id} className="flex items-center gap-3 rounded-xl p-3"
                            style={{ background: 'rgba(18,14,36,0.45)', border: '1px solid rgba(150,132,206,0.18)' }}>
                            <span className="text-xl">{a.story?.coverEmoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[var(--text-strong)] text-sm truncate">{a.story?.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {statusBadge(a.status)}
                                <span className="text-xs text-[#9D8CF6] font-bold">Niv.{a.level}</span>
                                <span className="text-xs text-[var(--text-muted)]">{OBJECTIVE_LABEL[a.objective]}</span>
                              </div>
                            </div>
                            {a.status === 'ready' && (
                              <button onClick={() => openAssignmentPreview(a._id)} className="text-[#9D8CF6] hover:text-white text-base flex-shrink-0" title="Voir les défis">👁</button>
                            )}
                            <button onClick={() => deleteAssignment(cls._id, a._id)} className="text-red-300/70 hover:text-red-300 text-sm font-bold flex-shrink-0">🗑</button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
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

        {/* ══════════ ONGLET TABLEAU DE BORD ══════════ */}
        {tab === 'dashboard' && (
          <div>
            {/* Sélecteur de classe */}
            <div className="card mb-6">
              <h2 className="text-2xl font-fredoka font-semibold text-[var(--text-strong)] mb-4">📊 Sélectionne une classe</h2>
              <div className="flex gap-3 flex-wrap">
                {classes.map((cls) => (
                  <button key={cls._id} onClick={() => setDashClassId(cls._id)}
                    className="font-fredoka font-semibold px-5 py-2.5 rounded-full transition-all"
                    style={dashClassId === cls._id ? tabActive : tabInactive}>
                    {cls.name}
                  </button>
                ))}
                {classes.length === 0 && (
                  <p className="text-[var(--text-muted)]">Aucune classe. Crée-en une dans l'onglet "Classes".</p>
                )}
              </div>
            </div>

            {dashClassId && (
              overviewLoading ? (
                <div className="text-center py-12"><div className="text-5xl animate-bounce">📊</div></div>
              ) : overview.length === 0 ? (
                <div className="card text-center py-10">
                  <p className="text-[var(--text-muted)] font-semibold">Aucun élève dans cette classe.</p>
                </div>
              ) : (
                <div className="card">
                  <h3 className="text-xl font-fredoka font-semibold text-[var(--text-strong)] mb-4">👥 Vue d'ensemble des élèves</h3>
                  <div className="space-y-3">
                    {overview.map((student) => (
                      <motion.div key={student._id}
                        className="flex items-center gap-4 rounded-2xl p-4 cursor-pointer transition-all hover:brightness-110"
                        style={radarStudent?._id === student._id
                          ? { background: 'rgba(142,128,242,0.18)', border: '2px solid rgba(157,140,246,0.50)' }
                          : { background: 'rgba(18,14,36,0.45)', border: '1px solid rgba(150,132,206,0.18)' }}
                        onClick={() => openRadar(student)}
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <Avatar src={student.avatar} size={48} />
                        <div className="flex-1">
                          <p className="font-bold text-[var(--text-strong)]">{student.name}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs font-bold">
                            <span className="text-[#FCE9A6]">⭐ {student.totalStars} étoiles</span>
                            <span className="text-[#9D8CF6]">🏆 Niv.{student.level}</span>
                            <span className="text-[#86efac]">{student.nbAssignmentsTermines}/{student.nbAssignmentsTotal} terminés</span>
                            <span className="text-[var(--text-muted)]">{student.totalPoints} pts</span>
                          </div>
                        </div>
                        <span className="text-[var(--text-muted)] text-sm font-bold">📡 Radar →</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          MODAL ASSIGNATION (nouvelle version)
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {assignModal && (
          <motion.div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setAssignModal(null)}>
            <motion.div className="rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
              style={{ background: 'rgba(28,22,50,0.97)', backdropFilter: 'blur(16px)', border: '1px solid rgba(173,156,224,0.22)' }}
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}>
              <AssignmentModal
                story={assignModal}
                classes={classes}
                onSuccess={(msg) => { setMessage(msg); setAssignModal(null); }}
                onClose={() => setAssignModal(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          MODAL PREVIEW HISTOIRE
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {previewStory && (
          <motion.div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setPreviewStory(null)}>
            <motion.div className="rounded-3xl shadow-2xl w-full max-w-xl max-h-[80vh] overflow-y-auto p-6"
              style={{ background: 'rgba(28,22,50,0.97)', backdropFilter: 'blur(16px)', border: '1px solid rgba(173,156,224,0.22)' }}
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-fredoka font-semibold text-[var(--text-strong)]">{previewStory.coverEmoji} {previewStory.title}</h2>
                  <p className="text-[var(--text-muted)] text-sm font-semibold">Texte narré par l'IA</p>
                </div>
                <button onClick={() => setPreviewStory(null)} className="text-[#B9AEE0] hover:text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>✕</button>
              </div>
              <div className="rounded-2xl p-5" style={{ background: 'rgba(18,14,36,0.55)', border: '1px solid rgba(150,132,206,0.22)' }}>
                <p className="text-[var(--text-soft)] font-semibold leading-relaxed whitespace-pre-line">
                  {previewStory.narratedText || 'Narration en cours de génération…'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          MODAL DÉFIS D'UN ASSIGNMENT
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {previewAssignment && (
          <motion.div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setPreviewAssignment(null)}>
            <motion.div className="rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-6"
              style={{ background: 'rgba(28,22,50,0.97)', backdropFilter: 'blur(16px)', border: '1px solid rgba(173,156,224,0.22)' }}
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-fredoka font-semibold text-[var(--text-strong)]">
                    {previewAssignment.story?.coverEmoji} {previewAssignment.story?.title}
                  </h2>
                  <p className="text-[var(--text-muted)] text-sm font-semibold">
                    🎯 {OBJECTIVE_LABEL[previewAssignment.objective]} · {previewAssignment.questions?.length || 0} défis
                  </p>
                </div>
                <button onClick={() => setPreviewAssignment(null)} className="text-[#B9AEE0] hover:text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>✕</button>
              </div>

              <div className="space-y-3">
                {(previewAssignment.questions || []).map((q, i) => (
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
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.35)', color: '#86efac' }}>
                        ✓ {q.correctAnswer ? 'Vrai' : 'Faux'}
                      </span>
                    )}
                    {q.type === 'order_events' && q.events && (
                      <p className="text-xs text-[var(--text-muted)]">Ordre : {q.correctOrder?.map((idx) => q.events[idx]).join(' → ')}</p>
                    )}
                    {q.hint && <p className="text-xs text-yellow-200/80 mt-1">💡 Indice : {q.hint}</p>}
                    {q.explanation && <p className="text-xs text-[var(--text-muted)] mt-1 italic">📝 {q.explanation}</p>}
                  </div>
                ))}
                {(!previewAssignment.questions || previewAssignment.questions.length === 0) && (
                  <p className="text-center text-[var(--text-muted)] py-6">Aucun défi (génération en cours ou erreur).</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          MODAL RADAR ÉLÈVE
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {radarStudent && (
          <motion.div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setRadarStudent(null)}>
            <motion.div className="rounded-3xl shadow-2xl w-full max-w-md p-6"
              style={{ background: 'rgba(28,22,50,0.97)', backdropFilter: 'blur(16px)', border: '1px solid rgba(173,156,224,0.22)' }}
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Avatar src={radarStudent.avatar} size={44} />
                  <div>
                    <h2 className="text-xl font-fredoka font-bold text-[var(--text-strong)]">{radarStudent.name}</h2>
                    <p className="text-[var(--text-muted)] text-sm">Radar des compétences</p>
                  </div>
                </div>
                <button onClick={() => setRadarStudent(null)} className="text-[#B9AEE0] hover:text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>✕</button>
              </div>

              {radarLoading ? (
                <div className="text-center py-10"><div className="text-4xl animate-bounce">📡</div></div>
              ) : radarData.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-[var(--text-muted)] font-semibold">Aucune donnée disponible.</p>
                  <p className="text-[var(--text-muted)] text-sm mt-1">L'élève n'a pas encore terminé d'assignments.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(180,165,225,0.25)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#C5BBE4', fontSize: 11, fontWeight: 700 }} />
                    <Radar dataKey="value" stroke="#8E80F2" fill="#8E80F2" fillOpacity={0.35} strokeWidth={2} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Score moyen']}
                      contentStyle={{ background: 'rgba(28,22,50,0.97)', border: '1px solid rgba(157,140,246,0.35)', borderRadius: 12, color: '#EDE7FB' }} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Modal d'assignation (nombre + types de questions) ───────────────────────
function AssignmentModal({ story, classes, onSuccess, onClose }) {
  const ALL_TYPES = [
    { id: 'mcq',          label: '🤔 QCM' },
    { id: 'true_false',   label: '⚖️ Vrai/Faux' },
    { id: 'fill_blank',   label: '🔤 Texte à trous' },
    { id: 'order_events', label: '⏳ Remettre en ordre' },
    { id: 'odd_one_out',  label: "🕵️ L'intrus" },
  ];

  const [classId, setClassId]             = useState('');
  const [objective, setObjective]         = useState('comprehension');
  const [level, setLevel]                 = useState(1);
  const [questionCount, setQuestionCount] = useState(5);
  const [questionTypes, setQuestionTypes] = useState(ALL_TYPES.map((t) => t.id));
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');

  const toggleType = (id) =>
    setQuestionTypes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const handleSubmit = async () => {
    if (!classId) { setError('Sélectionne une classe.'); return; }
    if (questionTypes.length === 0) { setError('Choisis au moins un type de question.'); return; }
    setSubmitting(true); setError('');
    try {
      await api.post('/assignments', { storyId: story._id, classId, objective, level, questionCount, questionTypes });
      onSuccess(`✅ Assignment créé ! L'IA génère ${questionCount} défis en arrière-plan…`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-fredoka font-semibold text-[var(--text-strong)]">📤 Assigner l'histoire</h2>
          <p className="text-[var(--text-soft)] font-semibold text-sm">{story.coverEmoji} {story.title}</p>
        </div>
        <button onClick={onClose} className="text-[#B9AEE0] hover:text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: 'rgba(255,255,255,0.06)' }}>✕</button>
      </div>

      <div className="space-y-5">
        {/* Classe */}
        <div>
          <label className="block font-bold text-[#CFC6EC] mb-2">🏫 Classe</label>
          {classes.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm">Aucune classe disponible. Crée-en une d'abord.</p>
          ) : (
            <div className="space-y-2">
              {classes.map((cls) => (
                <button key={cls._id} onClick={() => setClassId(cls._id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl font-bold text-left transition-all"
                  style={classId === cls._id
                    ? { border: '2px solid #8E80F2', background: 'rgba(142,128,242,0.15)', color: '#E7E0FA' }
                    : { border: '2px solid rgba(150,132,206,0.22)', background: 'rgba(18,14,36,0.35)', color: '#C5BBE4' }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs"
                    style={classId === cls._id ? { background: '#8E80F2', color: 'white' } : { border: '2px solid rgba(150,132,206,0.4)' }}>
                    {classId === cls._id && '✓'}
                  </span>
                  <span>{cls.name}</span>
                  <span className="ml-auto text-[var(--text-muted)] text-sm">{cls.students.length} élève(s)</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Objectif pédagogique */}
        <div>
          <label className="block font-bold text-[#CFC6EC] mb-2">🎯 Objectif pédagogique</label>
          <select className="input-field" value={objective} onChange={(e) => setObjective(e.target.value)}>
            {OBJECTIVES.map((o) => (<option key={o} value={o}>{OBJECTIVE_LABEL[o]}</option>))}
          </select>
        </div>

        {/* Nombre de défis */}
        <div>
          <label className="block font-bold text-[#CFC6EC] mb-2">🔢 Nombre de défis</label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setQuestionCount((n) => Math.max(1, n - 1))}
              className="w-10 h-10 rounded-xl font-bold text-xl flex items-center justify-center transition-all hover:brightness-110"
              style={{ background: 'rgba(142,128,242,0.18)', border: '1px solid rgba(157,140,246,0.40)', color: '#D9D2F7' }}>−</button>
            <span className="text-3xl font-fredoka font-bold text-[var(--text-strong)] w-12 text-center">{questionCount}</span>
            <button type="button" onClick={() => setQuestionCount((n) => Math.min(10, n + 1))}
              className="w-10 h-10 rounded-xl font-bold text-xl flex items-center justify-center transition-all hover:brightness-110"
              style={{ background: 'rgba(142,128,242,0.18)', border: '1px solid rgba(157,140,246,0.40)', color: '#D9D2F7' }}>+</button>
            <span className="text-xs text-[var(--text-muted)]">(1 à 10)</span>
          </div>
        </div>

        {/* Types de questions */}
        <div>
          <label className="block font-bold text-[#CFC6EC] mb-2">🧩 Types de questions</label>
          <div className="flex flex-wrap gap-2">
            {ALL_TYPES.map((t) => {
              const active = questionTypes.includes(t.id);
              return (
                <button key={t.id} type="button" onClick={() => toggleType(t.id)}
                  className="px-3 py-2 rounded-full text-sm font-bold transition-all"
                  style={active
                    ? { background: 'rgba(157,140,246,0.20)', border: '2px solid #9D8CF6', color: '#E7E0FA' }
                    : { background: 'rgba(18,14,36,0.45)', border: '1px solid rgba(150,132,206,0.25)', color: '#A99FCB' }}>
                  {active ? '✓ ' : ''}{t.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">L'IA n'utilisera que les types sélectionnés.</p>
        </div>

        {/* Niveau */}
        <div>
          <label className="block font-bold text-[#CFC6EC] mb-2">🏆 Niveau</label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setLevel((l) => Math.max(1, l - 1))}
              className="w-10 h-10 rounded-xl font-bold text-xl flex items-center justify-center transition-all hover:brightness-110"
              style={{ background: 'rgba(142,128,242,0.18)', border: '1px solid rgba(157,140,246,0.40)', color: '#D9D2F7' }}>−</button>
            <span className="text-3xl font-fredoka font-bold text-[var(--text-strong)] w-12 text-center">{level}</span>
            <button type="button" onClick={() => setLevel((l) => l + 1)}
              className="w-10 h-10 rounded-xl font-bold text-xl flex items-center justify-center transition-all hover:brightness-110"
              style={{ background: 'rgba(142,128,242,0.18)', border: '1px solid rgba(157,140,246,0.40)', color: '#D9D2F7' }}>+</button>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">Les élèves doivent terminer le niveau précédent pour accéder à ce niveau.</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-2xl text-sm font-bold text-red-300"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)' }}>
          ❌ {error}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 font-fredoka font-medium text-[#E7E0FA] py-3 rounded-2xl transition-all hover:brightness-110"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}>
          Annuler
        </button>
        <motion.button onClick={handleSubmit} disabled={submitting || !classId}
          className="flex-1 btn-primary" whileTap={{ scale: 0.95 }}>
          {submitting ? '⏳ Création…' : "✅ Créer l'assignment"}
        </motion.button>
      </div>
    </div>
  );
}
