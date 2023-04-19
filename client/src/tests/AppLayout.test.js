import { render, screen } from "@testing-library/react";
import AppLayout from "../components/AppLayout";
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
      user: { sub: "foobar" },
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

test("login/signup button calls loginWithRedirect", async () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <AppLayout />
    </MemoryRouter>
  );

  const loginButton = screen.getByText("Login / Sign Up");
  await userEvent.click(loginButton);

  expect(mockLoginWithRedirect).toHaveBeenCalled();
  //   expect(mockUseNavigate).toHaveBeenCalledWith("/home");
});

test("clicking profile link will navigate to /navigate", async () => {
  mockIsAuthenticated = true;
  render(
    <MemoryRouter initialEntries={["/"]}>
      <AppLayout />
    </MemoryRouter>
  );

  const button = screen.getByText("Profile");
  await userEvent.click(button);

  expect(mockUseNavigate).toHaveBeenCalledWith("../profile");
});
