import { Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <h1>HomeBite</h1>
      <p>Send homemade food to your loved ones.</p>

      <div>
        <Link to="/login">Login</Link>
        <br />
        <Link to="/register">Register</Link>
      </div>
    </div>
  );
}

export default Home;
