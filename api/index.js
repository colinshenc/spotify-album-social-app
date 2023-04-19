import express, { request } from "express";
import pkg from "@prisma/client";
import cors from "cors";
import morgan from "morgan";
import { URLSearchParams } from "url";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { auth } from "express-oauth2-jwt-bearer";
const app = express();
dotenv.config();
console.log(process.env.AUTH0_ISSUER);

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
  // console.log(data);
  const accessToken = data.access_token;
  return accessToken;
};

const call_api = async (artist, title) => {
  try {
    const accessToken = await retrieve_access_token();
    const query = `album%253A${encodeURIComponent(
      title
    )}%2520artist%253A${encodeURIComponent(artist)}`;

    // console.log(query);
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
    // console.log(data);
    // console.log("Printing data.albums.items[0]:\n");
    // console.log(data.albums.items[0]);
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

//add a new post, can only be used if artist and album are already in db
const add_post = async (artist_id, album_id, auth0_id, rating, content) => {
  let artist;
  let album;
  let post;
  let user;
  // console.log(artist_id);
  // console.log(album_id);
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
    console.log("suthid", auth0_id);
    user = await prisma.user.findUnique({
      where: {
        auth0Id: auth0_id,
      },
    });
    const user_id = user.id;
    console.log("user_id", user_id);
    if (artist && album) {
      post = await simple_add_post(album_id, user_id, rating, content);
      updateRating(album.id);
    } else {
      throw new Error("Album or artist not found!");
    }
    // console.log("post id: ", post.id);
    return post;
  } catch (err) {
    console.error("Error: ", err);
  }
};

// calculate the average rating of an album and update it in the db
const updateRating = async (album_id) => {
  console.log("Updating rate of an album...");
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

  let sum = 0;
  posts.forEach((post) => {
    sum += post.rating;
  });
  const averageRating = sum / posts.length;
  console.log("average rating: ", averageRating);
  await prisma.album.update({
    where: {
      id: album_id,
    },
    data: {
      rating: Math.floor(averageRating + 0.5),
    },
  });
};

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
    artist = await prisma.artist.findFirst({
      where: {
        name: artist_name_db,
      },
    });
    album = await prisma.album.findFirst({
      where: {
        title: title_db,
      },
    });

    if (!artist && album) {
      throw new Error("Album exists but artist not found!");
    } else if (artist && !album) {
      console.log("artist exist but album not exist");
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
    } else if (!artist && !album) {
      console.log("artist and album not exist");
      artist = await prisma.artist.create({
        data: {
          name: artist_name_db,
        },
      });
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
    }

    // console.log(album.id);
    res.send({ album_id: album.id, artist_id: artist.id });
  } catch (err) {
    console.error("Error: ", err);
  }
});

//get all posts
app.get("/api/posts", requireAuth, async (req, res) => {
  const posts = await prisma.post.findMany();
  res.send(posts);
});

//get all albums
app.get("/api/albums", async (req, res) => {
  const albums = await prisma.album.findMany();
  res.send(albums);
});

//get album by albums_id
app.get("/api/album/:id", requireAuth, async (req, res) => {
  const album = await prisma.album.findUnique({
    where: {
      id: req.params.id,
    },
  });
  // console.log(album);
  res.send(album);
});

//get all artists
app.get("/api/artists", requireAuth, async (req, res) => {
  const artists = await prisma.artist.findMany();
  res.send(artists);
});

//get all posts by author_id
// app.get("/api/posts/:author_id", requireAuth, async (req, res) => {
//   const posts = await prisma.post.findMany({
//     where: {
//       userId: parseInt(req.params.author_id),
//     },
//   });
//   res.send(posts);
// });

//get all posts by album_id
app.get("/api/posts/:album_id", requireAuth, async (req, res) => {
  const posts = await prisma.post.findMany({
    where: {
      albumId: req.params.album_id,
    },
  });
  res.send(posts);
});

//TODO:Need to add user and connect with post.
app.post("/api/post", requireAuth, async (req, res) => {
  const album_id = req.body.album_id;
  const artist_id = req.body.artist_id;
  const auth0_id = req.auth.payload.sub;
  console.log("authid", auth0_id);
  const rating = parseInt(req.body.rating);
  const content = req.body.content;
  const newPost = await add_post(
    artist_id,
    album_id,
    auth0_id,
    rating,
    content
  );
  console.log(newPost);
  res.status(200).send(newPost);
});

app.delete("/api/post/:id", requireAuth, async (req, res) => {
  var post;
  try {
    post = await prisma.post.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
  res.send("Success");
});

app.put("/api/post/:id", requireAuth, async (req, res) => {
  var post;
  const newRating = req.body.rating;
  const newContent = req.body.content;
  const auth0_id = req.auth.payload.sub;
  const userId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: {
        auth0Id: auth0Id,
      },
    });

    if (user && user.id === userId) {
      post = await prisma.post.update({
        where: {
          id: userId,
        },
        data: {
          rating: parseInt(newRating),
          content: newContent,
        },
      });
    }
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
  res.status(200).send("Success");
});

// app.get("/api/users", requireAuth, async (req, res) => {});
// app.post("")
//TODO:add user id.
app.post("/verify-user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const email = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/email`];
  const name = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/name`];
  console.log("auth0Id", auth0Id);
  console.log(req.auth.payload);
  console.log(email);
  console.log(name);
  // email = "abc@123.com";
  // name = "abc";
  const user = await prisma.user.findUnique({
    where: {
      auth0Id: auth0Id,
    },
  });
  if (user) {
    // res.status(200);
    res.json(user);
  } else {
    const newUser = await prisma.user.create({
      data: {
        auth0Id: auth0Id,
      },
    });
    res.json(newUser);
  }
});

app.get("/api/user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const user = await prisma.user.findUnique({
    where: {
      auth0Id: auth0Id,
    },
  });
  res.json(user);
});

app.listen(12000, () => {
  console.log("Server is running on port 12000");
});
