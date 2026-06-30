import { useState } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import ConfirmModal from "../ui/ConfirmModal";

function DashboardSidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const roleLinks = {
    home_cook: [
      { name: "Dashboard", path: "/family/dashboard" },
      { name: "Create Delivery", path: "/family/create-delivery" },
      { name: "Delivery History", path: "/family/history" },
      { name: "Addresses", path: "/family/addresses" },
    ],

    receiver: [
      { name: "Dashboard", path: "/receiver/dashboard" },
      { name: "Track Delivery", path: "/receiver/track" },
      { name: "Delivery History", path: "/receiver/history" },
    ],

    delivery_partner: [
      { name: "Dashboard", path: "/delivery/dashboard" },
      { name: "Available Deliveries", path: "/delivery/available" },
      { name: "History", path: "/delivery/history" },
    ],

    admin: [
      { name: "Dashboard", path: "/admin/dashboard" },
      { name: "Users", path: "/admin/users" },
      { name: "Deliveries", path: "/admin/deliveries" },
      { name: "Reports", path: "/admin/reports" },
    ],
  };

  const links = roleLinks[user?.role] || [];

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        ></div>
      )}

      <aside
        className={`fixed left-0 top-0 z-50 min-h-screen w-64 border-r border-green-100 bg-white/95 p-5 shadow-xl shadow-green-100/70 backdrop-blur transition-transform duration-300 md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-green-700">HomeBite</h2>
            <p className="text-xs font-medium text-orange-500">
              Homemade food delivery
            </p>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-lg border border-green-200 px-3 py-1 text-green-700 md:hidden"
          >
            X
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-linear-to-r from-green-50 to-orange-50 p-4">
          <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
          <p className="mt-1 text-xs text-gray-600">
            Role:{" "}
            <span className="font-semibold text-green-700">{user?.role}</span>
          </p>
        </div>

        <nav className="mt-8 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-linear-to-r from-green-600 to-emerald-500 text-white shadow-md shadow-green-200"
                    : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="mt-8 w-full rounded-xl bg-red-50 px-4 py-2.5 font-semibold text-red-600 transition hover:bg-red-100"
        >
          Logout
        </button>
      </aside>

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Logout?"
        message="Are you sure you want to logout from HomeBite?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}

export default DashboardSidebar;
