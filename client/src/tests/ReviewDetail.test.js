import { render, screen } from "@testing-library/react";
import ReviewDetail from "../components/ReviewDetail";
import { MemoryRouter } from "react-router-dom";
import { useAuthToken } from "../AuthTokenContext";

import "@testing-library/jest-dom/extend-expect";
// import userEvent from "@testing-library/user-event";

let mockIsAuthenticated = true;
const mockLoginWithRedirect = jest.fn();
const mockUseNavigate = jest.fn();

// jest.mock("@auth0/auth0-react", () => ({
//   ...jest.requireActual("@auth0/auth0-react"),
//   Auth0Provider: ({ children }) => children,
//   useAuth0: () => {
//     return {
//       isLoading: false,
//       user: { sub: "foobar", nickname: "abc", name: "abc@123.com" },
//       isAuthenticated: mockIsAuthenticated,
//       loginWithRedirect: mockLoginWithRedirect,
//     };
//   },
// }));

jest.mock("../AuthTokenContext", () => ({
  useAuthToken: () => ({
    accessToken: "test",
  }),
}));

test("Check review page contains <h3> and <p> tag", async () => {
  mockIsAuthenticated = true;
  render(
    <MemoryRouter initialEntries={["/"]}>
      <ReviewDetail />
    </MemoryRouter>
  );
  expect(screen.getByRole("heading")).toHaveTextContent("Reviews");
  expect(
    screen.getByText("To leave your review, please login.")
  ).toBeInTheDocument();
});
