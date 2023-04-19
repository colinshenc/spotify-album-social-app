import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import NotFound from "../components/NotFound";

test("renders Not Found copy", () => {
  render(<NotFound />);
  expect(screen.getByText("Page Not Found!")).toBeInTheDocument();
});
