import { Link, NavLink } from "react-router-dom";

import Button from "../ui/Button";

function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-green-100 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-3xl">🍱</span>

          <div>
            <h1 className="text-2xl font-extrabold text-green-700">HomeBite</h1>
            <p className="text-xs font-medium text-orange-500">
              Homemade Food Delivery
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <NavLink
            to="/"
            className="font-semibold text-gray-700 hover:text-green-700"
          >
            Home
          </NavLink>

          <NavLink
            to="/login"
            className="font-semibold text-gray-700 hover:text-green-700"
          >
            Login
          </NavLink>

          <Link to="/register">
            <Button>Register</Button>
          </Link>
        </div>

        <div className="md:hidden">
          <Link to="/login">
            <Button variant="outline">Login</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
