import "../style/appLayout.css";

import { Outlet, Link, useNavigate} from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export default function AppLayout() {
  const { user, isLoading, isAuthenticated, logout, loginWithRedirect } =
    useAuth0();

  console.log("USER: ", user);
  const navigate = useNavigate();
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <div className="title">
        <h1>Music Review App</h1>
      </div>
      <div className="header">
        <nav className="menu">
          <ul className="menu-list">
            <li>
              <button onClick={() => navigate("../home")}>Home</button>
            </li>
            <li>
              {!isAuthenticated && (
                <button className="btn-primary" onClick={loginWithRedirect}>
                  Login / Sign Up
                </button>
              )}
            </li>
            <li>{isAuthenticated && <button onClick={() => navigate("../profile")}>Profile</button>}</li>
            <li>
              {isAuthenticated && (
                <button
                  className="exit-button"
                  onClick={() => logout({ returnTo: window.location.origin })}
                >
                  LogOut
                </button>
              )}
            </li>
          </ul>
        </nav>
        {isAuthenticated && <div>Welcome 👋 {user.nickname} </div>}
      </div>
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}
