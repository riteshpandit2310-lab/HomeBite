import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";

import Home from "../pages/home/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import NotFound from "../pages/shared/NotFound";

import RoleDashboard from "../pages/dashboard/RoleDashboard";

import FamilyDashboard from "../pages/family/FamilyDashboard";
import CreateDelivery from "../pages/family/CreateDelivery";
import FamilyDeliveryHistory from "../pages/family/DeliveryHistory";
import Addresses from "../pages/family/Addresses";

import ReceiverDashboard from "../pages/receiver/ReceiverDashboard";
import ReceiverTrack from "../pages/receiver/ReceiverTrack";
import ReceiverHistory from "../pages/receiver/ReceiverHistory";

import DeliveryDashboard from "../pages/delivery/DeliveryDashboard";
import AvailableDeliveries from "../pages/delivery/AvailableDeliveries";
import DeliveryPartnerHistory from "../pages/delivery/DeliveryHistory";

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminDeliveries from "../pages/admin/AdminDeliveries";
import AdminReports from "../pages/admin/AdminReports";
import LiveTrackingPage from "../pages/tracking/LiveTrackingPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/tracking/:deliveryId"
          element={
            <ProtectedRoute
              allowedRoles={[
                "home_cook",
                "receiver",
                "delivery_partner",
                "admin",
              ]}
            >
              <LiveTrackingPage />
            </ProtectedRoute>
          }
        />
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<RoleDashboard />} />

          <Route
            path="/family/dashboard"
            element={
              <ProtectedRoute allowedRoles={["home_cook"]}>
                <FamilyDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/family/create-delivery"
            element={
              <ProtectedRoute allowedRoles={["home_cook"]}>
                <CreateDelivery />
              </ProtectedRoute>
            }
          />

          <Route
            path="/family/history"
            element={
              <ProtectedRoute allowedRoles={["home_cook"]}>
                <FamilyDeliveryHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/family/addresses"
            element={
              <ProtectedRoute allowedRoles={["home_cook"]}>
                <Addresses />
              </ProtectedRoute>
            }
          />

          <Route
            path="/receiver/dashboard"
            element={
              <ProtectedRoute allowedRoles={["receiver"]}>
                <ReceiverDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/receiver/track"
            element={
              <ProtectedRoute allowedRoles={["receiver"]}>
                <ReceiverTrack />
              </ProtectedRoute>
            }
          />

          <Route
            path="/receiver/history"
            element={
              <ProtectedRoute allowedRoles={["receiver"]}>
                <ReceiverHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/delivery/dashboard"
            element={
              <ProtectedRoute allowedRoles={["delivery_partner"]}>
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/delivery/available"
            element={
              <ProtectedRoute allowedRoles={["delivery_partner"]}>
                <AvailableDeliveries />
              </ProtectedRoute>
            }
          />

          <Route
            path="/delivery/history"
            element={
              <ProtectedRoute allowedRoles={["delivery_partner"]}>
                <DeliveryPartnerHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/deliveries"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDeliveries />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminReports />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
