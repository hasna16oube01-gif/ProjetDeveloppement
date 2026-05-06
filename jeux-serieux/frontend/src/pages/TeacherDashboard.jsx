import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [stories, setStories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('stories');
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: '', difficulty: 'medium', coverEmoji: '📖' });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [className, setClassName] = useState('');
  const fileRef = useRef();
  const pollingRef = useRef();

  const EMOJIS = ['📖', '🦁', '🌊', '🚀', '🏰', '🌺', '🐉', '⚡'];

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
    // Poll for processing stories
    pollingRef.current = setInterval(loadStories, 5000);
    return () => clearInterval(pollingRef.current);
  }, []);

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
      await api.post('/stories', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage('🎉 Histoire envoyée ! L\'IA la traite en ce moment...');
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

  const createClass = async () => {
    if (!className.trim()) return;
    try {
      await api.post('/classes', { name: className });
      setClassName('');
      loadClasses();
    } catch (err) { console.error(err); }
  };

  const deleteStory = async (id) => {
    if (!confirm('Supprimer cette histoire ?')) return;
    await api.delete(`/stories/${id}`);
    loadStories();
  };

  const statusBadge = (status) => {
    const map = {
      processing: { label: '⏳ En traitement', cls: 'bg-yellow-100 text-yellow-700' },
      ready: { label: '✅ Prête', cls: 'bg-green-100 text-green-700' },
      error: { label: '❌ Erreur', cls: 'bg-red-100 text-red-700' },
    };
    const s = map[status] || map.processing;
    return <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl animate-bounce">⏳</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-fredoka text-blue-700">
              👩‍🏫 Bonjour, {user.name} !
            </h1>
            <p className="text-gray-500 font-semibold">{stories.length} histoire(s) créée(s)</p>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-red-400 font-bold transition-colors">
            🚪 Déconnexion
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[{ id: 'stories', label: '📚 Histoires' }, { id: 'classes', label: '👥 Classes' }].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`font-bold px-5 py-2 rounded-2xl transition-all ${
                tab === t.id ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {message && (
          <motion.div
            className="bg-blue-50 border-2 border-blue-200 text-blue-700 font-bold p-4 rounded-2xl mb-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {message}
          </motion.div>
        )}

        {/* STORIES TAB */}
        {tab === 'stories' && (
          <div>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="btn-primary mb-6 flex items-center gap-2"
            >
              ➕ Nouvelle histoire
            </button>

            {/* Upload form */}
            <AnimatePresence>
              {showUpload && (
                <motion.div
                  className="card mb-6 border-2 border-blue-200"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <h2 className="text-xl font-fredoka text-blue-600 mb-4">📤 Uploader une histoire</h2>
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                      <label className="block font-bold text-gray-600 mb-1">Titre de l'histoire</label>
                      <input
                        className="input-field"
                        placeholder="Ex: Le lion et la souris"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-2">Icône de couverture</label>
                      <div className="flex gap-2 flex-wrap">
                        {EMOJIS.map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setForm({ ...form, coverEmoji: em })}
                            className={`text-2xl p-2 rounded-xl transition-all ${
                              form.coverEmoji === em ? 'bg-blue-100 ring-2 ring-blue-400 scale-125' : 'hover:bg-gray-100'
                            }`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-1">Difficulté</label>
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
                      <label className="block font-bold text-gray-600 mb-1">Fichier texte (.txt)</label>
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".txt"
                        className="block w-full text-gray-600 font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-100 file:text-blue-700 file:font-bold hover:file:bg-blue-200 cursor-pointer"
                        onChange={(e) => setFile(e.target.files[0])}
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <motion.button
                        type="submit"
                        className="btn-primary flex-1"
                        disabled={uploading}
                        whileTap={{ scale: 0.95 }}
                      >
                        {uploading ? '🤖 L\'IA travaille...' : '🚀 Envoyer à l\'IA'}
                      </motion.button>
                      <button
                        type="button"
                        onClick={() => setShowUpload(false)}
                        className="bg-gray-100 text-gray-600 font-bold px-4 py-2 rounded-2xl hover:bg-gray-200"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Story list */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stories.length === 0 && (
                <div className="col-span-3 card text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-400 font-bold text-lg">Aucune histoire créée</p>
                  <p className="text-gray-400">Cliquez sur "Nouvelle histoire" pour commencer !</p>
                </div>
              )}
              {stories.map((story) => (
                <motion.div
                  key={story._id}
                  className="card hover:shadow-xl transition-shadow"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{story.coverEmoji}</span>
                    {statusBadge(story.status)}
                  </div>
                  <h3 className="font-black text-gray-800 text-lg mb-1">{story.title}</h3>
                  <p className="text-gray-400 text-sm font-semibold mb-3">
                    {new Date(story.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                  <div className="flex gap-2">
                    {story.status === 'ready' && (
                      <a href={`/story/${story._id}`} className="text-blue-500 font-bold text-sm hover:underline">
                        👁 Voir
                      </a>
                    )}
                    <button
                      onClick={() => deleteStory(story._id)}
                      className="text-red-400 font-bold text-sm hover:text-red-600 ml-auto"
                    >
                      🗑 Suppr.
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* CLASSES TAB */}
        {tab === 'classes' && (
          <div>
            <div className="card mb-6">
              <h2 className="text-xl font-fredoka text-blue-600 mb-4">➕ Créer une classe</h2>
              <div className="flex gap-3">
                <input
                  className="input-field flex-1"
                  placeholder="Ex: CP - Classe de Mme Martin"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
                <button onClick={createClass} className="btn-primary whitespace-nowrap">
                  Créer
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {classes.map((cls) => (
                <div key={cls._id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-fredoka text-gray-800">{cls.name}</h3>
                    <span className="bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-full text-sm">
                      Code: {cls.joinCode}
                    </span>
                  </div>
                  <p className="text-gray-500 font-semibold mb-3">
                    👥 {cls.students.length} élève(s)
                  </p>
                  {cls.students.length > 0 && (
                    <div className="space-y-2">
                      {cls.students.map((s) => (
                        <div key={s._id} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                          <span>{s.avatar}</span>
                          <span className="font-bold text-gray-700">{s.name}</span>
                          <span className="ml-auto text-yellow-500 font-bold text-sm">⭐ {s.totalStars}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {classes.length === 0 && (
                <div className="col-span-2 card text-center py-10">
                  <div className="text-5xl mb-3">🏫</div>
                  <p className="text-gray-400 font-bold">Aucune classe créée</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
