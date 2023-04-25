import { render, screen } from "@testing-library/react";
import VerifyUser from "../components/VerifyUser";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";

let mockIsAuthenticated = false;
const mockUseNavigate = jest.fn();

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

test("check if loading... in verifyuser", async () => {
  mockIsAuthenticated = true;
  render(
    <MemoryRouter initialEntries={["/"]}>
      <VerifyUser />
    </MemoryRouter>
  );

  expect(screen.getByText("Loading...")).toBeInTheDocument();
});
