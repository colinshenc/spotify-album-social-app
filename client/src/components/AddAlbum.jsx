import React from "react";
import { useAuthToken } from "../AuthTokenContext";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function AddAlbum() {
  const { accessToken } = useAuthToken();
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const albumData = {
      artistName: event.target.elements.artistName.value,
      albumName: event.target.elements.albumName.value,
    };

    try {
      let res = await fetch(`${API_URL}/api/album`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(albumData),
      });

      if (!res.ok) {
        if (res.status === 409) {
          alert(
            "The Album you are trying to add already exists! Please visit the album page to leave your review."
          );
          const { album_id } = await res.json();
          navigate(`../details/${album_id}`);
          return;
        } else {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      }

      const { album_id, artist_id } = await res.json();

      const post = {
        album_id,
        artist_id,
        rating: event.target.elements.rating.value,
        content: event.target.elements.comment.value,
      };

      res = await fetch(`${API_URL}/api/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(post),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      navigate(`../details/${album_id}`);
    } catch (error) {
      console.error("Error occurs when submitting data: ", error);
    }

    event.target.reset();
  };

  return (
    <>
      {accessToken ? (
        <div className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <h2 className="text-center">Review a New Album</h2>
              <p className="text-center">
                Please use this form to leave your review for a new album
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="artistName">Artist Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    id="artistName"
                    name="artistName"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="albumName">Album Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    id="albumName"
                    name="albumName"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="rating">Rating:</label>
                  <select
                    className="form-control"
                    id="rating"
                    name="rating"
                    required
                  >
                    <option value="">Select a rating</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="comment">Comment:</label>
                  <textarea
                    className="form-control"
                    id="comment"
                    name="comment"
                    rows="4"
                    required
                  ></textarea>
                </div>
                <button type="submit" className="button">
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <h1>You are not logged in</h1>
      )}
    </>
  );
}

export default AddAlbum;
