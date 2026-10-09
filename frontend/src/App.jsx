import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import { AppShell } from './layouts/AppShell.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { EventsPage } from './pages/EventsPage.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { JoinPage } from './pages/JoinPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { PasswordPage } from './pages/PasswordPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { StayComingSoonPage } from './pages/StayComingSoonPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/stay" element={<StayComingSoonPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/password"
              element={
                <ProtectedRoute>
                  <PasswordPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
