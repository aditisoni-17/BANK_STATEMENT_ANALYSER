import { useEffect } from "react";
import Dashboard from "./Dashboard";
import Processing from "./Processing";
import Upload from "./components/Upload";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { logoutUser, refreshAuth, useAuth } from "./auth";
import { navigateTo, usePathname } from "./router";
import "./index.css";

function App() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    refreshAuth();
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    const protectedRoutes = ["/upload", "/processing", "/dashboard"];

    if (pathname === "/") {
      navigateTo(user ? "/upload" : "/login");
      return;
    }

    if (protectedRoutes.includes(pathname) && !user) {
      navigateTo("/login");
      return;
    }

    if ((pathname === "/login" || pathname === "/signup") && user) {
      navigateTo("/upload");
    }
  }, [pathname, user, loading]);

  const handleLogout = async () => {
    await logoutUser();
    navigateTo("/login");
  };

  if (loading && pathname !== "/login" && pathname !== "/signup") {
    return null;
  }

  if (pathname === "/login") {
    return <Login />;
  }

  if (pathname === "/signup") {
    return <Signup />;
  }

  if (pathname === "/upload") {
    return (
      <ProtectedRoute isAuthenticated={Boolean(user)} isLoading={loading}>
        <Upload onUploadSuccess={() => {}} />
      </ProtectedRoute>
    );
  }

  if (pathname === "/processing") {
    return (
      <ProtectedRoute isAuthenticated={Boolean(user)} isLoading={loading}>
        <Processing />
      </ProtectedRoute>
    );
  }

  if (pathname === "/dashboard") {
    return (
      <ProtectedRoute isAuthenticated={Boolean(user)} isLoading={loading}>
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "16px 20px 0",
            }}
          >
            <button
              type="button"
              onClick={handleLogout}
              style={{
                border: "none",
                borderRadius: 8,
                background: "#111827",
                color: "#fff",
                padding: "10px 14px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Logout
            </button>
          </div>
          <Dashboard />
        </div>
      </ProtectedRoute>
    );
  }

  return null;
}

export default App;
