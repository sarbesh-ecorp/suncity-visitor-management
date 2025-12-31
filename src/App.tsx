import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./admin/protectedRoutes";
import Client from "./client";
import VisitorLogin from "./visitor-admin/login";
import VisitorDashboard from "./visitor-admin/dashboard";
import VisitorUsersList from "./visitor-admin/client-management";
import VisitorSystemUsers from "./visitor-admin/users";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Client />} />
        
        <Route path="/visitor-login" element={<VisitorLogin/>} />
        
        <Route
          path="/visitor-admin/dashboard"
          element={
            <ProtectedRoute>
              <VisitorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/visitor-admin/client-management"
          element={
            <ProtectedRoute>
              <VisitorUsersList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/visitor-admin/users"
          element={
            <ProtectedRoute>
              <VisitorSystemUsers />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<VisitorLogin />} />
      </Routes>
    </BrowserRouter>
  );
}
