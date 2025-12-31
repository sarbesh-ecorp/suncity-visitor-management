import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: any) {
  const isLoggedIn = localStorage.getItem("token");
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}
