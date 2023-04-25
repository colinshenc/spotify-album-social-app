import { render, screen } from "@testing-library/react";
import AddAlbum from "../components/AddAlbum";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";

jest.mock("../AuthTokenContext", () => ({
  useAuthToken: () => ({
    accessToken: "test",
  }),
}));

test("Check if prompt exists in add album page", async () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <AddAlbum />
    </MemoryRouter>
  );
  expect(screen.getByText("Review a New Album")).toBeInTheDocument();
  expect(
    screen.getByText(
      "Please use this form to leave your review for a new album"
    )
  ).toBeInTheDocument();
});
