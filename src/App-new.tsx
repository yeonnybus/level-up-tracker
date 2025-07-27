import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { AppLayout } from "./components/AppLayout";
import { Auth } from "./components/Auth";
import { AuthGuard } from "./components/AuthGuard";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { Dashboard } from "./pages/Dashboard";
import { GroupDashboardPage } from "./pages/GroupDashboardPage";
import { GroupsPage } from "./pages/GroupsPage";
import { ProfileSetupPage } from "./pages/ProfileSetupPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TasksPage } from "./pages/TasksPage";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {/* Tailwind 테스트 */}
        <div className="mb-4 p-4 bg-blue-500 text-white rounded-lg shadow-lg">
          <p className="text-sm">Tailwind CSS 테스트</p>
        </div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* 인증이 필요하지 않은 경로들 */}
        <Route
          path="/auth"
          element={!user ? <Auth /> : <Navigate to="/" replace />}
        />
        <Route
          path="/profile-setup"
          element={
            <AuthGuard requireProfile={false}>
              <ProfileSetupPage />
            </AuthGuard>
          }
        />

        {/* 인증과 프로필이 모두 필요한 경로들 */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="groups/:groupId" element={<GroupDashboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* 인증되지 않은 사용자를 위한 기본 경로 */}
        <Route
          path="*"
          element={
            !user ? (
              <Navigate to="/auth" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
