import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from "react";
import {
  FiLock, FiEye, FiEyeOff, FiUser, FiZap, FiBookOpen,
  FiHash, FiUserPlus, FiBarChart2, FiShield, FiChevronLeft,
} from "react-icons/fi";
import { BsRobot } from "react-icons/bs";

export default function LoginPage() {
  const [selected, setSelected] = useState(null); // null | 'teacher' | 'student'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [classCode, setClassCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleTeacherLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(teacherEmail, teacherPassword);
      navigate(user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentJoin = (e) => {
    e.preventDefault();
    console.log("Student join:", { classCode, studentName });
  };

  return (
    <div
      className="min-h-screen relative flex flex-col"
      style={{
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/60 via-purple-900/40 to-indigo-950/70 pointer-events-none" />

      {/* HEADER */}
      <header className="relative z-10 flex items-center justify-between px-6 py-3 bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <FiBookOpen className="text-white w-4 h-4" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">LumiStory</span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/40 text-white text-sm font-medium hover:bg-white/10 transition-all">
          <FiZap className="w-4 h-4 text-yellow-300" />
          Découvrir LumiStory
        </button>
      </header>

      {/* MAIN */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 py-12 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full items-center">

          {/* LEFT */}
          <div className="text-white space-y-5">
            <h1 className="text-5xl xl:text-6xl font-extrabold leading-tight drop-shadow-lg">
              L'apprentissage<br />devient une<br />aventure
            </h1>
            <p className="text-white/85 text-base leading-relaxed max-w-sm">
              LumiStory transforme les histoires en défis éducatifs grâce à l'intelligence artificielle.
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Pour les enseignants. Pour les élèves.<br />Pour grandir ensemble.
            </p>
          </div>

          {/* RIGHT */}
          <div>

            {/* STEP 1 — two cards */}
            {!selected && (
              <div className="space-y-4">
                <button
                  onClick={() => setSelected('teacher')}
                  className="w-full text-left backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-3xl p-6 flex items-center gap-5 transition-all duration-200"
                >
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-xl mb-1">Espace Enseignant</h2>
                    <p className="text-white/65 text-sm">Créez vos classes, vos histoires<br />et suivez les progrès.</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelected('student')}
                  className="w-full text-left backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-3xl p-6 flex items-center gap-5 transition-all duration-200"
                >
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FiUser className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-xl mb-1">Espace Élève</h2>
                    <p className="text-white/65 text-sm">Rejoignez votre classe et vivez<br />l'aventure des histoires.</p>
                  </div>
                </button>
              </div>
            )}

            {/* STEP 2 — Teacher form */}
            {selected === 'teacher' && (
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8">
                <button
                  onClick={() => { setSelected(null); setError(''); }}
                  className="flex items-center gap-1 text-white/60 hover:text-white text-sm mb-5 transition-all"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  Connexion à l'espace enseignant
                </button>

                <form onSubmit={handleTeacherLogin} className="space-y-4">
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                    <input
                      type="email"
                      placeholder="Adresse e-mail"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    />
                  </div>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mot de passe"
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition">
                      {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                      <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)}
                        className="w-4 h-4 rounded border-white/30 bg-white/10" />
                      Se souvenir de moi
                    </label>
                    <button type="button" className="text-sm text-indigo-300 hover:underline">Mot de passe oublié ?</button>
                  </div>
                  {error && <p className="text-red-400 text-sm text-center">❌ {error}</p>}
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-900/40">
                    {loading ? '⏳ Connexion...' : 'Se connecter'}
                  </button>
                </form>

                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-white/15" />
                  <span className="text-white/40 text-xs">ou</span>
                  <div className="flex-1 h-px bg-white/15" />
                </div>

                {/* Créer un compte enseignant */}
                <button
                  onClick={() => navigate('/register')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all"
                >
                  <FiUserPlus className="w-4 h-4" />
                  Créer un compte enseignant
                </button>
              </div>
            )}

            {/* STEP 2 — Student form */}
            {selected === 'student' && (
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8">
                <button
                  onClick={() => setSelected(null)}
                  className="flex items-center gap-1 text-white/60 hover:text-white text-sm mb-5 transition-all"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  Connexion à l'espace élève
                </button>

                <form onSubmit={handleStudentJoin} className="space-y-4">
                  <div className="relative">
                    <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Code de classe"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                  </div>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Ton prénom"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />
                  </div>
                  <button type="submit"
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-900/40 mt-1">
                    Rejoindre ma classe
                  </button>
                </form>

                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-white/15" />
                  <span className="text-white/40 text-xs">ou</span>
                  <div className="flex-1 h-px bg-white/15" />
                </div>

                {/* Créer un compte pour les élèves qui n'en ont pas encore */}
                <button
                  onClick={() => navigate('/register')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all"
                >
                  <FiUserPlus className="w-4 h-4" />
                  Créer un compte
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 mx-4 mb-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/10 px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-6 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600/30 flex items-center justify-center flex-shrink-0">
                <FiZap className="text-purple-400 w-5 h-5" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">IA Narrative</p>
                <p className="text-slate-400 text-xs leading-tight">Des histoires captivantes<br />générées par l'IA.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/30 flex items-center justify-center flex-shrink-0">
                <FiBarChart2 className="text-orange-400 w-5 h-5" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Défis Adaptatifs</p>
                <p className="text-slate-400 text-xs leading-tight">Des activités variées<br />et adaptées à chaque élève.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-500/30 flex items-center justify-center flex-shrink-0">
                <FiShield className="text-green-400 w-5 h-5" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Apprentissage Progressif</p>
                <p className="text-slate-400 text-xs leading-tight">Des niveaux et des parcours<br />pour progresser à son rythme.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-white text-sm font-medium">Une question ?</p>
              <p className="text-slate-300 text-xs">Je suis Lumi, ton assistant IA !</p>
            </div>
            <div className="relative animate-bounce">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
                <BsRobot className="text-white w-7 h-7" />
              </div>
              <div className="absolute -top-8 -left-20 bg-white rounded-xl px-2 py-1 text-xs text-slate-700 font-medium shadow-md whitespace-nowrap">
                Je suis Lumi ! 👋
                <div className="absolute bottom-[-6px] right-3 w-3 h-3 bg-white rotate-45" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
