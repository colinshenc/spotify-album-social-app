import { render, screen } from "@testing-library/react";
import Profile from "../components/Profile";
import { MemoryRouter, json } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";

let mockIsAuthenticated = true;
const mockLoginWithRedirect = jest.fn();

jest.mock("@auth0/auth0-react", () => ({
  ...jest.requireActual("@auth0/auth0-react"),
  Auth0Provider: ({ children }) => children,
  useAuth0: () => {
    return {
      isLoading: false,
      user: {
        name: "abc@123.com",
        email: "abc@123.com",
      },
      isAuthenticated: mockIsAuthenticated,
      loginWithRedirect: mockLoginWithRedirect,
    };
  },
}));

jest.mock("../AuthTokenContext", () => ({
  useAuthToken: () => ({
    accessToken: "test",
  }),
}));

test("Profile page displays Username and email", async () => {
  mockIsAuthenticated = true;
  const user = {
    name: "abc",
    email: "abc@123.com",
  };
  global.fetch = jest.fn().mockResolvedValueOnce({
    json: jest.fn().mockResolvedValueOnce(user),
  });
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Profile />
    </MemoryRouter>
  );

  // check if the User Profile is rendered
  expect(await screen.findByText("User Profile")).toBeInTheDocument();
  // check user name email field is not empty
  expect(await screen.findByText("Email: abc@123.com")).toBeInTheDocument();
  expect(await screen.findByText("Username: abc")).toBeInTheDocument();
});
