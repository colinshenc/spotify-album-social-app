import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RatingStars from "./RatingStars";
import { useAuthToken } from "../AuthTokenContext";
import "../style/reviewDetail.css";

function ReviewDetail() {
  const API_URL = process.env.REACT_APP_API_URL;
  const params = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState();
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPost, setSelectedPost] = useState({});
  const [userId, setUserId] = useState();

  const formRef = useRef();
  const { accessToken } = useAuthToken();

  async function getReviewDetails() {
    let res = await fetch(`${API_URL}/api/album/${params.id}`, {
      method: "GET",
    });

    if (res.status === 404) {
      navigate("../AlbumNotFound");
    }

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const album_data = await res.json();

    if (album_data) {
      setAlbum(album_data);
    } else {
      navigate("../404");
    }

    res = await fetch(`${API_URL}/api/posts/${params.id}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const allPosts = await res.json();

    if (allPosts) {
      setPosts(allPosts);
    }
  }

  async function updateUserId() {
    const res = await fetch(`${API_URL}/api/user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const user = await res.json();

    if (user) {
      setUserId(user.id);
    }
  }

  useEffect(() => {
    if (params.id) {
      getReviewDetails();
    }
  }, []);

  useEffect(() => {
    if (params.id && accessToken) {
      getReviewDetails();
      updateUserId();
    }
  }, [accessToken]);

  useEffect(() => {
    if (isEditing) {
      formRef.current.elements.rating.value = selectedPost.rating;
      formRef.current.elements.comment.value = selectedPost.content;
    }
  }, [selectedPost]);

  const handleUpdate = async (event) => {
    event.preventDefault();
    const updatedPost = {
      rating: event.target.elements.rating.value,
      content: event.target.elements.comment.value,
    };

    try {
      const res = await fetch(`${API_URL}/api/post/${selectedPost.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updatedPost),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      setTimeout(() => {
        setIsEditing(false);
        getReviewDetails();
      }, 1000);
    } catch (error) {
      console.error("Error occurs when submitting data: ", error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const newPost = {
      artist_id: album.artistId,
      album_id: album.id,
      rating: event.target.elements.rating.value,
      content: event.target.elements.comment.value,
    };

    try {
      const res = await fetch(`${API_URL}/api/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newPost),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      setTimeout(() => {
        getReviewDetails();
      }, 1000);
    } catch (error) {
      console.error("Error occurs when submitting data: ", error);
    }
  };
  const handleEditClick = (post) => {
    if (!isEditing) {
      setSelectedPost(post);
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  };

  const deletePost = async (post) => {
    try {
      const res = await fetch(`${API_URL}/api/post/${post.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      if (posts.length === 1) {
        deleteAlbum();
      } else {
        setTimeout(() => {
          getReviewDetails();
        }, 1000);
      }
    } catch (error) {
      console.error("Error occurs when submitting data: ", error);
    }
  };

  const deleteAlbum = async () => {
    try {
      const res = await fetch(`${API_URL}/api/album/${album.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      navigate("/home");
    } catch (error) {
      console.error("Error occurs when submitting data: ", error);
    }
  };

  return (
    <>
      {album && (
        <div>
          <h2>{album.title} </h2>
          <img
            className="album-pic"
            src={album.imgURL}
            alt={`album name: ${album.title}; artist name: ${album.artistName}`}
          />
          <div className="album-info">
            <table className="table table-borderless table-striped table-hover">
              <tbody>
                <tr>
                  <th scope="row">Name</th>
                  <td>{album.title}</td>
                </tr>
                <tr>
                  <th scope="row">Artist</th>
                  <td>{album.artistName}</td>
                </tr>
                <tr>
                  <th scope="row">Release</th>
                  <td>{album.release}</td>
                </tr>
                <tr>
                  <th scope="row">Tracks</th>
                  <td>{album.tracks}</td>
                </tr>
                <tr>
                  <th scope="row">Ratings</th>
                  <td>
                    <RatingStars rating={album.rating} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {posts &&
        (userId ? (
          <>
            {posts.filter((post) => post.userId === userId).length !== 0 ? (
              <>
                <h3>My Review</h3>
                {posts
                  .filter((post) => post.userId === userId)
                  .map((post) => (
                    <div key={post.id}>
                      <button
                        className="button"
                        onClick={() => handleEditClick(post)}
                      >
                        Edit
                      </button>
                      <button
                        className="button"
                        onClick={() => deletePost(post)}
                      >
                        Delete
                      </button>
                      {!isEditing && (
                        <ul className="review">
                          <li>
                            Rating: <RatingStars rating={post.rating} />
                          </li>
                          <li>Comment: {post.content}</li>
                        </ul>
                      )}

                      {isEditing && (
                        <div className="container mt-5">
                          <div className="row justify-content-center">
                            <div className="col-md-6">
                              <form ref={formRef} onSubmit={handleUpdate}>
                                <div className="form-group">
                                  <label htmlFor="rating">Rating:</label>
                                  <select
                                    type="number"
                                    className="form-control"
                                    id="rating"
                                    name="rating"
                                    defaultValue={selectedPost.rating}
                                    required
                                  >
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
                                    id="comment"
                                    className="form-control"
                                    name="comment"
                                    defaultValue={selectedPost.content}
                                    required
                                  ></textarea>
                                </div>
                                <button className="button" type="submit">
                                  Update
                                </button>
                              </form>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </>
            ) : (
              <>
                <div className="container mt-5">
                  <div className="row justify-content-center">
                    <div className="col-md-6">
                      <h3 className="text-center">Post your review</h3>

                      <form onSubmit={handleSubmit}>
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
                        <button className="button" type="submit">
                          Post
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </>
            )}

            {posts.filter((post) => post.userId !== userId).length !== 0 && (
              <>
                <h3>Review of Others</h3>
                <div className="table-container">
                  {posts
                    .filter((post) => post.userId !== userId)
                    .map((post) => (
                      <table
                        className="table table-borderless table-hover review-table"
                        key={post.id}
                      >
                        <tbody>
                          <tr>
                            <td>
                              <RatingStars rating={post.rating} />
                            </td>
                            <td>{post.content}</td>
                          </tr>
                        </tbody>
                      </table>
                    ))}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <p>To leave your review, please login.</p>
            <h3>Reviews</h3>
            <div className="table-container">
              {posts.map((post) => (
                <table
                  className="table table-borderless table-hover review-table"
                  key={post.id}
                >
                  <tbody>
                    <tr>
                      <td>
                        <RatingStars rating={post.rating} />
                      </td>
                      <td>{post.content}</td>
                    </tr>
                  </tbody>
                </table>
              ))}
            </div>
          </>
        ))}
    </>
  );
}

export default ReviewDetail;
