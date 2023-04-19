import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

function Profile() {
  const { user } = useAuth0();
  console.log(user);
  return (
    <>
      <h1>Profile Page</h1>
      <ul>
        <li>User Name: {user.nickname}</li>
        <li>Email: {user.name}</li>
      </ul>
    </>
  );
}

export default Profile;
