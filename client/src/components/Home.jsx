import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RatingStars from "./RatingStars";
import { useAuthToken } from "../AuthTokenContext";
import { useAuth0 } from "@auth0/auth0-react";

function Home() {
  const { isAuthenticated } = useAuth0();
  const [albums, setAlbums] = useState([]);
  const [user, setUser] = useState();

  const API_URL = process.env.REACT_APP_API_URL;

  const navigate = useNavigate();
  const { accessToken } = useAuthToken();

  useEffect(() => {
    async function getAlbums() {
      const res = await fetch(`${API_URL}/api/albums`);

      const albums = await res.json();

      if (albums && albums.length) {
        setAlbums(albums);
      }
    }

    getAlbums();
  }, []);

  useEffect(() => {
    async function getUsers() {
      if (accessToken) {
        const res = await fetch(`${API_URL}/api/user`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const user = await res.json();
        if (user) {
          setUser(user);
        }
      }
    }

    getUsers();
  }, [accessToken]);

  return (
    <>
      <div>
        {user && <div>Welcome 👋 {user.name} </div>}
        {isAuthenticated && (
          <>
            <div>
              <p>Click this button to leave your review for a new album</p>
              <button
                className="button"
                onClick={() => navigate("../review-new-album")}
              >
                Review New Album
              </button>
            </div>
            <br />
          </>
        )}
      </div>
      <div>
        {<h2>Albums</h2>}
        <div className="album-container">
          {albums.map((album) => (
            <div
              className="album-item"
              key={album.id}
              onClick={() => navigate(`../details/${album.id}`)}
            >
              <img
                className="album-img"
                src={album.imgURL}
                alt={`album name: ${album.title}; artist name: ${album.artistName}`}
              />

              <div style={{ textAlign: "center" }}>
                <p>Artist: {album.artistName}</p>
                <RatingStars rating={album.rating} />
                <h3>{album.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Home;
