import { Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <div>
      <div>
        <h1>HomeBite</h1>
        <p>Send homemade food to your loved ones.</p>
      </div>

      <Outlet />
    </div>
  );
}

export default AuthLayout;
