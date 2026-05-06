import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StoryPlayer from './pages/StoryPlayer';
import LoadingSpinner from './components/shared/LoadingSpinner';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;

  return (
    <Routes>
      <Route path="/" element={
        user ? (
          user.role === 'teacher' ? <Navigate to="/teacher" /> : <Navigate to="/student" />
        ) : <LandingPage />
      } />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/teacher" element={
        <PrivateRoute role="teacher"><TeacherDashboard /></PrivateRoute>
      } />
      <Route path="/student" element={
        <PrivateRoute role="student"><StudentDashboard /></PrivateRoute>
      } />
      <Route path="/story/:id" element={
        <PrivateRoute><StoryPlayer /></PrivateRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
