import { render, screen } from "@testing-library/react";
import Home from "../components/Home";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import userEvent from "@testing-library/user-event";

let mockIsAuthenticated = false;
const mockLoginWithRedirect = jest.fn();
const mockUseNavigate = jest.fn();

jest.mock("@auth0/auth0-react", () => ({
  ...jest.requireActual("@auth0/auth0-react"),
  Auth0Provider: ({ children }) => children,
  useAuth0: () => {
    return {
      isLoading: false,
      user: {
        name: "abc",
        email: "abc@123.com",
      },
      isAuthenticated: mockIsAuthenticated,
      loginWithRedirect: mockLoginWithRedirect,
    };
  },
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => {
    return mockUseNavigate;
  },
}));

jest.mock("../AuthTokenContext", () => ({
  useAuthToken: () => ({
    accessToken: "test",
  }),
}));

test("renders Home Albums", () => {
  mockIsAuthenticated = false;
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Home />
    </MemoryRouter>
  );
  expect(screen.getByText("Albums")).toBeInTheDocument();
});

test("renders home with review button when user is authenticated", () => {
  mockIsAuthenticated = true;

  render(
    <MemoryRouter initialEntries={["/"]}>
      <Home isAuthenticated={mockIsAuthenticated} />
    </MemoryRouter>
  );

  expect(screen.getByText("Albums")).toBeInTheDocument();
  expect(screen.getByText("Review New Album")).toBeInTheDocument();
});

test("review new album button navigates to /review-new-album", async () => {
  mockIsAuthenticated = true;

  render(
    <MemoryRouter initialEntries={["/"]}>
      <Home isAuthenticated={mockIsAuthenticated} />
    </MemoryRouter>
  );

  const reviewButton = screen.getByText("Review New Album");
  await userEvent.click(reviewButton);
  expect(mockUseNavigate).toHaveBeenCalledWith("../review-new-album");
});
