import React from "react";
import * as ReactDOMClient from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Home from "./components/Home";
import Profile from "./components/Profile";
import AddAlbum from "./components/AddAlbum";
import { Auth0Provider } from "@auth0/auth0-react";
import { AuthTokenProvider } from "./AuthTokenContext";
import ReviewDetail from "./components/ReviewDetail";
import NotFound from "./components/NotFound";
import VerifyUser from "./components/VerifyUser";

const container = document.getElementById("root");
const root = ReactDOMClient.createRoot(container);

const requestedScopes = [
  "profile",
  "email",
  "read:album",
  "read:user",
  "read:post",
  "edit:post",
  "edit:user",
  "delete:post",
  "delete:user",
  "write:album",
  "write:user",
  "write:post",
];

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/verify-user`,
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        scope: requestedScopes.join(" "),
      }}
    >
      <AuthTokenProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/details/:id" element={<ReviewDetail />} />
              <Route path="/verify-user" element={<VerifyUser />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/review-new-album" element={<AddAlbum />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthTokenProvider>
    </Auth0Provider>
  </React.StrictMode>
);
