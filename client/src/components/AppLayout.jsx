import "../style/appLayout.css";

import { Outlet, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export default function AppLayout() {
  const { isLoading, isAuthenticated, logout, loginWithRedirect } = useAuth0();

  const navigate = useNavigate();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="title">
          <h1>Album Reviewer</h1>
        </div>

        <nav className="menu">
          <ul className="menu-list">
            <li>
              <button
                className="nav-button"
                onClick={() => navigate("../home")}
              >
                Home
              </button>
            </li>

            {!isAuthenticated ? (
              <li>
                <button className="nav-button" onClick={loginWithRedirect}>
                  Login
                </button>
              </li>
            ) : (
              <>
                <li>
                  <button
                    className="nav-button"
                    onClick={() => navigate("../profile")}
                  >
                    Profile
                  </button>
                </li>

                <li>
                  <button
                    className="nav-button"
                    onClick={() => logout({ returnTo: window.location.origin })}
                  >
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </header>

      <div className="content">
        <Outlet />
      </div>

      <footer className="footer">
        &copy;{new Date().getFullYear()} Cheng Shen <br />
      </footer>
    </div>
  );
}
