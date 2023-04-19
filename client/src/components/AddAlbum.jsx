import React, { useState } from "react";
import { useAuthToken } from "../AuthTokenContext";
import { useNavigate } from "react-router-dom";

function AddAlbum() {
  const { accessToken } = useAuthToken();
  console.log("AccessToken: ", accessToken);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const albumData = {
      artistName: event.target.elements.artistName.value,
      albumName: event.target.elements.albumName.value,
    };
    // handle form submission using formData object
    console.log(albumData);
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
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const { album_id, artist_id } = await res.json();

      const post = {
        album_id,
        artist_id,
        rating: event.target.elements.rating.value,
        content: event.target.elements.comment.value,
      };
      console.log("New Post --");
      console.log(post);

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
    <div>
      <h2>Review a New Album</h2>
      <p>Please use this form to leave your review for a new album</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="artistName">Artist Name:</label>
          <input type="text" id="artistName" name="artistName" required />
        </div>
        <div>
          <label htmlFor="albumName">Album Name:</label>
          <input type="text" id="albumName" name="albumName" required />
        </div>
        <div>
          <label htmlFor="rating">Rating:</label>
          <input
            type="number"
            id="rating"
            name="rating"
            min="0"
            max="5"
            required
          />
        </div>
        <div>
          <label htmlFor="comment">Comment:</label>
          <textarea id="comment" name="comment" required />
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default AddAlbum;
