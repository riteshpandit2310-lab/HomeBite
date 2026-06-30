import { useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardSidebar from "../components/layout/DashboardSidebar";

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-linear-to-br from-green-50 via-orange-50 to-white">
      <DashboardSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-green-100 bg-white/90 px-4 py-3 shadow-sm backdrop-blur md:hidden">
          <h1 className="text-xl font-extrabold text-green-700">HomeBite</h1>

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-green-700"
          >
            ☰
          </button>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
