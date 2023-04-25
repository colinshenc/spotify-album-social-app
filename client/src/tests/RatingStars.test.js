import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import RatingStars from "../components/RatingStars";

test("check ratingstars renders correct stars as directed", () => {
  render(<RatingStars rating={4} />);
  const spanElement = screen.getByText("⭐⭐⭐⭐☆", { exact: false });
  expect(spanElement).toBeInTheDocument();
});
