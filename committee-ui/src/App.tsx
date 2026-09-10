import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AppShell from "./AppShell";
import { useAuth } from "./lib/auth";
import Home from "./screens/Home";
import Login from "./screens/Login";
import {
  FundTypes,
  Grants,
  Households,
  Payments,
  ServiceTickets,
} from "./screens/Lists";
import Placeholder from "./screens/Placeholder";
import Settings from "./screens/Settings";

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="community/households" element={<Households />} />
          <Route
            path="community/members"
            element={
              <Placeholder
                title="Members"
                doctype="Jamath Household"
              />
            }
          />
          <Route
            path="community/subscriptions"
            element={<Placeholder title="Subscriptions" doctype="Jamath Membership" />}
          />
          <Route path="funds/types" element={<FundTypes />} />
          <Route path="funds/payments" element={<Payments />} />
          <Route
            path="funds/journal"
            element={<Placeholder title="Ledger entries" doctype="Journal Entry" />}
          />
          <Route path="services/tickets" element={<ServiceTickets />} />
          <Route
            path="services/announcements"
            element={<Placeholder title="Announcements" doctype="Jamath Announcement" />}
          />
          <Route path="welfare/grants" element={<Grants />} />
          <Route
            path="welfare/staff"
            element={<Placeholder title="Staff & payroll" doctype="Jamath Staff" />}
          />
          <Route
            path="welfare/compliance"
            element={<Placeholder title="Compliance" doctype="Jamath Compliance Item" />}
          />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
