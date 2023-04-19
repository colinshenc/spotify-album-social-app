import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import RatingStars from "./RatingStars";
// import { API_URL } from "../constants";
import { useAuthToken } from "../AuthTokenContext";
import { useAuth0 } from "@auth0/auth0-react";

function Home() {
  const { isAuthenticated } = useAuth0();
  const [albums, setAlbums] = useState([]);
  // const { accessToken } = useAuthToken();
  // console.log("AccessToken: ", accessToken);

  const API_URL = process.env.REACT_APP_API_URL;

  const navigate = useNavigate();

  useEffect(() => {
    console.log("useEffect called:");
    async function getAlbums() {
      console.log("getAlbums called:");
      console.log(`${API_URL}/api/albums`);
      let res = await fetch(`${API_URL}/api/albums`);
      console.log("fetched albums");
      console.log(res);
      let albums = await res.json();
      console.log(albums);

      if (albums && albums.length) {
        setAlbums(albums);
      }
    }

    getAlbums();
    console.log("ALBUMS:  ");
    console.log(albums);
  }, []);

  const handleAlbumClick = (album_id) => {
    isAuthenticated
      ? navigate(`../details/${album_id}`)
      : alert("Please log in to view details of album reviews");
  };


  return (
    <>
      <div>
        {isAuthenticated && (
          <div>
            <p>Please click this link to leave your review for a new album</p>
            <h2>
              <button onClick={() => navigate("../review-new-album")}>Review New Album</button>
            </h2>
            <p>
              If you want to add your review for one of the existing albums
              below, please click the album.
            </p>
          </div>
        )}
      </div>
      <div>
        <h2>Albums Reviewed:</h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {albums.map((album) => (
            <div
              key={album.id}
              style={{
                width: "calc(100% / 4 - 10px)",
                margin: "10px",
                padding: "10px",
                border: "1px solid black",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
              onClick={() => handleAlbumClick(album.id)}
            >
              <img
                src={album.imgURL}
                alt={album.title}
                style={{
                  width: "300px",
                  height: "300px",
                  objectFit: "cover",
                }}
              />

              <div style={{ textAlign: "center" }}>
                <h2>{album.title}</h2>
                <p>Artist: {album.artistName}</p>
                <RatingStars rating={album.rating} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Home;
