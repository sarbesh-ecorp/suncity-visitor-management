import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./admin/protectedRoutes";
import Client from "./client";
import VisitorLogin from "./visitor-admin/login";
import VisitorDashboard from "./visitor-admin/dashboard";
import VisitorUsersList from "./visitor-admin/client-management";
import VisitorSystemUsers from "./visitor-admin/users";
import ThankYou from "./components/thankyou";
import ChannelPartnerRegistration from "./components/brokerRegistration";
import VisitorRegistrationForm from "./components/VisitorRegistrationForm";
import PublicLayout from "./client";
import HomeScreen from "./components/HomeScreen";
import ChannelPartner from "./visitor-admin/channel-partner-management";
import NewVisitorUsersList from "./visitor-admin/client-new";

export default function App() {
  return (
    <BrowserRouter basename="/visitor-management">
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/channel-partner-registration" element={<ChannelPartnerRegistration />} />
          <Route path="/visitor-registration" element={<VisitorRegistrationForm />} />
          <Route path="/thank-you" element={<ThankYou />} />
        </Route>

        <Route path="/visitor-login" element={<VisitorLogin />} />

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
          path="/visitor-admin/new-client-management"
          element={
            <ProtectedRoute>
              <NewVisitorUsersList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/visitor-admin/channel-partner-management"
          element={
            <ProtectedRoute>
              <ChannelPartner />
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

        <Route path="*" element={<Client />} />
      </Routes>
    </BrowserRouter>
  );
}
