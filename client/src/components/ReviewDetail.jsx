import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import RatingStars from "./RatingStars";
import { useAuthToken } from "../AuthTokenContext";
function ReviewDetail() {
  const API_URL = process.env.REACT_APP_API_URL;
  const params = useParams();

  const [album, setAlbum] = useState();
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPost, setSelectedPost] = useState({});
  const [postToDelete, setPostToDelete] = useState({});

  const [userId, setUserId] = useState();

  const formRef = useRef();
  const { accessToken } = useAuthToken();
  console.log("AccessToken in ReviewDetail:", accessToken);

  async function getReviewDetails() {
    let res = await fetch(`${API_URL}/api/album/${params.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const album = await res.json();

    if (album) {
      setAlbum(album);
    }
    res = await fetch(`${API_URL}/api/posts/${params.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const allPosts = await res.json();
    console.log("AllPosts", allPosts);
    if (allPosts) {
      setPosts(allPosts);
      console.log("setPosts called!");
    }
    console.log("Posts", posts);
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
      console.log("userID", user.id);
      setUserId(user.id);
    }
  }

  useEffect(() => {
    console.log("useEffect called!");
    if (params.id) {
      getReviewDetails();
    }
    updateUserId();
  }, [accessToken]);

  useEffect(() => {
    // console.log("selectedPost changed: ");
    // console.log(selectedPost);
    if (isEditing) {
      formRef.current.elements.rating.value = selectedPost.rating;
      formRef.current.elements.comment.value = selectedPost.content;
    }
  }, [selectedPost]);

  useEffect(() => {
    console.log("postToDelete changed: ");
    console.log(postToDelete);
    deletePost();
  }, [postToDelete]);

  const handleSubmit = async (event) => {
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

      getReviewDetails();
      setIsEditing(false);
    } catch (error) {
      console.error("Error occurs when submitting data: ", error);
    }
  };

  const handleEditClick = (post) => {
    //console.log(post);
    if (!isEditing) {
      setSelectedPost(post);
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  };

  const deletePost = async () => {
    console.log("deletePost called");
    console.log(postToDelete);
    console.log(postToDelete.id);
    // try {
    //   console.log(postToDelete.id);
    //   console.log(`${API_URL}/api/post/${String(postToDelete.id)}`);
    //   const res = await fetch(
    //     `${API_URL}/api/post/${String(postToDelete.id)}`,
    //     {
    //       method: "DELETE",
    //     }
    //   );
    //   console.log(res);
    //   if (!res.ok) {
    //     throw new Error(`HTTP error! status: ${res.status}`);
    //   }
    //   window.location.reload();
    // } catch (error) {
    //   console.error("Error occurs when submitting data: ", error);
    // }
  };

  return (
    <>
      {userId && album && (
        <div>
          <h2>Review Detail of Album --- {album.title} </h2>
          <h2>User Id -- {userId}</h2>
          <img
            src={album.imgURL}
            alt={album.title}
            style={{ width: "300px", height: "300px" }}
          />
          <ul>
            <li>Alblum: {album.title}</li>
            <li>Artist: {album.artistName}</li>
            <li>
              Average Rating: <RatingStars rating={album.rating} />
            </li>
          </ul>

          {posts.filter((post) => post.userId === userId).length !== 0 ? (
            <>
              <h3>My Review</h3>
              {posts
                .filter((post) => post.userId === userId)
                .map((post) => (
                  <ul key={post.id}>
                    <button onClick={() => handleEditClick(post)}>Edit</button>
                    <button onClick={() => setPostToDelete(post)}>
                      Delete
                    </button>
                    {!isEditing && (
                      <>
                        <li>
                          Rating: <RatingStars rating={post.rating} />
                        </li>
                        <li>Comment: {post.content}</li>
                      </>
                    )}

                    {isEditing && (
                      <form ref={formRef} onSubmit={handleSubmit}>
                        <div>
                          <label htmlFor="rating">Rating:</label>
                          <input
                            type="number"
                            id="rating"
                            name="rating"
                            min="0"
                            max="5"
                            defaultValue={selectedPost.rating}
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="comment">Comment:</label>
                          <textarea
                            id="comment"
                            name="comment"
                            defaultValue={selectedPost.content}
                            required
                          ></textarea>
                        </div>
                        <button type="submit">Update</button>
                      </form>
                    )}
                  </ul>
                ))}
            </>
          ) : (
            <>
              <h3>Post your review</h3>
              <form onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="rating">Rating:</label>
                  <input
                    type="number"
                    id="rating"
                    name="rating"
                    min="0"
                    max="5"
                    defaultValue={selectedPost.rating}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="comment">Comment:</label>
                  <textarea
                    id="comment"
                    name="comment"
                    defaultValue={selectedPost.content}
                    required
                  ></textarea>
                </div>
                <button type="submit">Post</button>
              </form>
            </>
          )}

          {posts.filter((post) => post.userId !== userId).length !== 0 && (
            <>
              <h3>Review of Others</h3>
              {[...posts]
                .filter((post) => post.userId !== userId)
                .map((post) => (
                  <ul key={post.id}>
                    <li>
                      Rating: <RatingStars rating={post.rating} />
                    </li>
                    <li>Comment: {post.content}</li>
                  </ul>
                ))}
            </>
          )}
        </div>
      )}
    </>
  );
}

export default ReviewDetail;
