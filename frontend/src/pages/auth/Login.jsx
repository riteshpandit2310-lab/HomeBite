import { Link } from "react-router-dom";

function Login() {
  return (
    <div>
      <h1>Login Page</h1>

      <p>Welcome back to HomeBite.</p>

      <Link to="/">Go to Home</Link>
    </div>
  );
}

export default Login;
