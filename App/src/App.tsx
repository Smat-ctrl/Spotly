import { Routes, Route, Navigate } from "react-router-dom";
import Discover from "./pages/Discover";
import Saved from "./pages/Saved";
import CollectionPage from "./pages/CollectionPage";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import LocationGate from "./pages/LocationGate";
import Random from "./pages/Random";
import { AuthStorage } from "./userData/AuthStorage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!AuthStorage.isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  if (AuthStorage.isLoggedIn()) {
    return <Navigate to="/profile" replace />;
  }
  return <>{children}</>;
}

function DiscoverRoute() {
  const savedLocation = localStorage.getItem("spotly_location");

  if (!savedLocation) {
    return <Navigate to="/location" replace />;
  }

  return <Discover />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/location" replace />} />
      <Route path="/location" element={<LocationGate />} />
      <Route path="/discover" element={<DiscoverRoute />} />
      <Route path="/random" element={<Random/>}/>
      <Route path="/saved" element={<Saved />} />
      <Route path="/collection-page/:collectionId" element={<CollectionPage />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <SignUp />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="/signin" element={<Navigate to="/signup" replace />} />
    </Routes>
  );
}
