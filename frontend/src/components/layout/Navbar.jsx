import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <div>
        <h2>HomeBite</h2>

        <div>
          <Link to="/">Home</Link>
          {" | "}
          <Link to="/login">Login</Link>
          {" | "}
          <Link to="/register">Register</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
