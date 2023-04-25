import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RatingStars from "./RatingStars";
import { useAuthToken } from "../AuthTokenContext";
import { countries } from "../constant";

function Profile() {
  const [user, setUser] = useState();
  const { accessToken } = useAuthToken();
  const [reviewedAlbums, setReviewedAlbums] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;

  const navigate = useNavigate();

  async function updateUser() {
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

  async function updateReviewedAlbum() {
    let res = await fetch(`${API_URL}/api/albums`);

    let albums = await res.json();

    res = await fetch(`${API_URL}/api/posts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const posts = await res.json();

    if (posts && posts.length) {
      let reviewedAlbums = [];
      posts.forEach((post) => {
        const album = albums.find((album) => album.id === post.albumId);
        if (album) {
          reviewedAlbums.push(album);
        }
      });

      setReviewedAlbums([...reviewedAlbums]);
    }
  }

  useEffect(() => {
    if (accessToken) {
      updateUser();
    }
  }, [accessToken]);

  useEffect(() => {
    if (showDetails) {
      updateReviewedAlbum();
    }
  }, [showDetails]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const profileData = {
      name: event.target.elements.name.value,
      age: event.target.elements.age.value,
      country: event.target.elements.country.value,
    };

    try {
      const res = await fetch(`${API_URL}/api/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(profileData),
      });
      if (!res.ok) {
        throw new Error("Something went wrong");
      }
      const user = await res.json();
      if (user) {
        setUser(user);
      }
      alert("Profile updated successfully");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <>
      {accessToken ? (
        <>
          {user && (
            <div className="container mt-5">
              <div className="row justify-content-center">
                <div className="col-md-6">
                  <h2 className="text-center">User Profile</h2>
                  {user.email && <p>Email: {user.email}</p>}
                  {user.name && <p>Username: {user.name}</p>}

                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label htmlFor="name" className="form-label">
                        Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        defaultValue={user ? user.name : ""}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="age" className="form-label">
                        Age
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="age"
                        name="age"
                        min="0"
                        max="100"
                        defaultValue={user ? user.age : ""}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="country" className="form-label">
                        Country
                      </label>
                      <select
                        className="form-select"
                        id="country"
                        name="country"
                        value={user ? user.country : ""}
                        onChange={(event) =>
                          setUser({ ...user, country: event.target.value })
                        }
                        required
                      >
                        <option value="">Select a country</option>
                        {countries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="button">
                      Update Profile
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {showDetails ? (
            reviewedAlbums.length !== 0 ? (
              <>
                <button
                  className="button"
                  onClick={() => {
                    setShowDetails(false);
                  }}
                >
                  Hide My Reviews
                </button>
                <div>
                  {<h2>Albums Reviewed</h2>}
                  <div className="album-container">
                    {reviewedAlbums.map((album) => (
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
            ) : (
              <p>You have not reviewed any albums</p>
            )
          ) : (
            <button
              className="button"
              onClick={() => {
                setShowDetails(true);
              }}
            >
              Show My Reviews
            </button>
          )}
        </>
      ) : (
        <h1>You are not logged in</h1>
      )}
    </>
  );
}

export default Profile;
