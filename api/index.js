import express from "express";
import pkg from "@prisma/client";
import cors from "cors";
import morgan from "morgan";
import { URLSearchParams } from "url";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { auth } from "express-oauth2-jwt-bearer";
const app = express();
dotenv.config();

const requireAuth = auth({
  issuerBaseURL: process.env.AUTH0_ISSUER,
  audience: process.env.AUTH0_AUDIENCE,
  tokenSigningAlg: "RS256",
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

//retrieve spotify access token
const retrieve_access_token = async () => {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", process.env.SPOTIFY_CLIENT_ID);
  params.append("client_secret", process.env.SPOTIFY_CLIENT_SECRET);

  var response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  var data = await response.json();
  const accessToken = data.access_token;
  return accessToken;
};

//Call spotify api to get album info
const call_api = async (artist, title) => {
  try {
    const accessToken = await retrieve_access_token();
    const query = `artist%253A${encodeURIComponent(
      title
    )}%2520album%253A${encodeURIComponent(artist)}`;

    const options = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=album&limit=1`,
      options
    );
    const data = await response.json();
    return data.albums.items[0];
  } catch (err) {
    console.error("Error: ", err);
  }
};

//add a post, connect by id
const simple_add_post = async (album_id, user_id, rating, content) => {
  return await prisma.post.create({
    data: {
      album: {
        connect: {
          id: album_id,
        },
      },
      user: {
        connect: {
          id: user_id,
        },
      },
      rating: rating,
      content: content,
    },
  });
};

// calculate the average rating of an album and update it in the db
const updateRating = async (album_id) => {
  const album = await prisma.album.findUnique({
    where: {
      id: album_id,
    },
  });

  const posts = await prisma.post.findMany({
    where: {
      albumId: album_id,
    },
  });

  if (posts.length !== 0) {
    let sum = 0;
    posts.forEach((post) => {
      sum += post.rating;
    });
    const averageRating = sum / posts.length;

    await prisma.album.update({
      where: {
        id: album_id,
      },
      data: {
        rating: Math.floor(averageRating + 0.5),
      },
    });
  }
};

//add a new post, can only be used if artist and album are already in db
const add_post = async (artist_id, album_id, auth0_id, rating, content) => {
  let artist;
  let album;
  let post;
  let user;
  try {
    artist = await prisma.artist.findUnique({
      where: {
        id: parseInt(artist_id),
      },
    });
    album = await prisma.album.findUnique({
      where: {
        id: album_id,
      },
    });

    user = await prisma.user.findUnique({
      where: {
        auth0Id: auth0_id,
      },
    });
    const user_id = user.id;

    if (artist && album) {
      post = await simple_add_post(album_id, user_id, rating, content);
      await updateRating(album.id);
    } else {
      throw new Error("Album or artist not found!");
    }

    return post;
  } catch (err) {
    console.error("Error: ", err);
  }
};

/******************************* API Endpoints for Album ***********************************/

//get all albums
app.get("/api/albums", async (req, res) => {
  try {
    const albums = await prisma.album.findMany();
    if (!albums) {
      res.status(404).send("No albums found");
    } else {
      res.send(albums);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

//get album by album_id
app.get("/api/album/:id", async (req, res) => {
  try {
    const album = await prisma.album.findUnique({
      where: {
        id: req.params.id,
      },
    });
    if (!album) {
      res.status(404).send("Album not found");
    } else {
      res.send(album);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

// add new album.
// given 1)artist name, 2)album name from the request body
// call api then add to db and return a json with info to display.
app.post("/api/album", requireAuth, async (req, res) => {
  const title_query = req.body.albumName;
  const artist_name_query = req.params.artistName;
  const data = await call_api(artist_name_query, title_query);
  const artist_name_db = data.artists[0].name;
  const title_db = data.name;
  var album;
  var artist;

  try {
    // get the artist info from database
    artist = await prisma.artist.findFirst({
      where: {
        name: artist_name_db,
      },
    });
    // get the album info from database
    album = await prisma.album.findFirst({
      where: {
        title: title_db,
      },
    });

    // if album already exists, return the album id;
    // no need to add the same album again
    if (album) {
      res.status(409).send({ album_id: album.id });
      return;
    }

    // if artist does not exist, add the artist to database
    if (!artist) {
      artist = await prisma.artist.create({
        data: {
          name: artist_name_db,
        },
      });
    }

    // add the new album to database
    album = await prisma.album.create({
      data: {
        id: data.id,
        title: title_db,
        release: data.release_date,
        tracks: data.total_tracks,
        artist: {
          connect: {
            id: artist.id,
          },
        },
        artistName: artist_name_db,

        imgURL: data.images[0].url,
      },
    });

    res.send({ album_id: album.id, artist_id: artist.id });
  } catch (err) {
    res.status(500).send(err);
  }
});

/******************************* API Endpoints for Post ***********************************/

//get all posts for a user_id
app.get("/api/posts", requireAuth, async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const user = await prisma.user.findUnique({
      where: {
        auth0Id: auth0Id,
      },
    });
    if (user) {
      const posts = await prisma.post.findMany({
        where: {
          userId: user.id,
        },
      });
      res.send(posts);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

//get all posts by album_id
app.get("/api/posts/:album_id", async (req, res) => {
  const posts = await prisma.post.findMany({
    where: {
      albumId: req.params.album_id,
    },
  });
  res.send(posts);
});

//delete album by album_id
app.delete("/api/album/:id", requireAuth, async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const user = await prisma.user.findUnique({
      where: {
        auth0Id: auth0Id,
      },
    });
    if (user) {
      const album = await prisma.album.delete({
        where: {
          id: req.params.id,
        },
      });
      res.send(album);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

//add a new post
app.post("/api/post", requireAuth, async (req, res) => {
  const album_id = req.body.album_id;
  const artist_id = req.body.artist_id;
  const auth0_id = req.auth.payload.sub;

  const rating = parseInt(req.body.rating);
  const content = req.body.content;
  const newPost = await add_post(
    artist_id,
    album_id,
    auth0_id,
    rating,
    content
  );

  res.status(200).send(newPost);
});

//delete a post
app.delete("/api/post/:id", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const postId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: {
        auth0Id: auth0Id,
      },
    });

    if (user) {
      const post = await prisma.post.findUnique({
        where: {
          id: postId,
        },
      });

      if (post.userId === user.id) {
        await prisma.post.delete({
          where: {
            id: postId,
          },
        });
        await updateRating(post.albumId);
        res.status(200).send("Post deleted");
      }
    }
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
});

//update a post
app.put("/api/post/:id", requireAuth, async (req, res) => {
  const newRating = req.body.rating;
  const newContent = req.body.content;
  const auth0Id = req.auth.payload.sub;
  const postId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: {
        auth0Id: auth0Id,
      },
    });

    if (user) {
      const post = await prisma.post.findUnique({
        where: {
          id: postId,
        },
      });

      if (post.userId === user.id) {
        const updatedPost = await prisma.post.update({
          where: {
            id: postId,
          },
          data: {
            rating: parseInt(newRating),
            content: newContent,
          },
        });

        await updateRating(post.albumId);
        res.status(200).send(updatedPost);
      }
    }
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
});

/******************************* API Endpoints for User ***********************************/

// get user by auth0Id
app.get("/api/user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const user = await prisma.user.findUnique({
    where: {
      auth0Id: auth0Id,
    },
  });
  res.json(user);
});

// verify user; if user exists, return user; if not, create user and then return user
app.post("/verify-user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const email = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/email`];
  const name = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/name`];

  const user = await prisma.user.findUnique({
    where: {
      auth0Id: auth0Id,
    },
  });
  if (user) {
    res.json(user);
  } else {
    const newUser = await prisma.user.create({
      data: {
        auth0Id: auth0Id,
        email: email,
        name: name,
      },
    });
    res.json(newUser);
  }
});

// update user information (name, age, country)
app.put("/api/user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const user = await prisma.user.findUnique({
    where: {
      auth0Id: auth0Id,
    },
  });
  if (user) {
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: req.body.name,
        age: parseInt(req.body.age),
        country: req.body.country,
      },
    });
    res.status(200).send(updatedUser);
  }
});

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
