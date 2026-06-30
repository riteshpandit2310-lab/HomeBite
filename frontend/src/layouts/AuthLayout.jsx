import { Link, Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-orange-50 to-white">
      <header className="border-b border-green-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-3xl">🍱</span>

            <div>
              <h1 className="text-2xl font-extrabold text-green-700">
                HomeBite
              </h1>
              <p className="text-xs font-medium text-orange-500">
                Homemade food delivery
              </p>
            </div>
          </Link>

          <Link
            to="/"
            className="rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
          >
            Back Home
          </Link>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default AuthLayout;
