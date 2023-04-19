export default function RatingStars({ rating }) {
  const starCount = Math.round(rating);
  const fullStars = "⭐".repeat(starCount);
  const emptyStars = "☆".repeat(5 - starCount);
  return <span>{fullStars + emptyStars}</span>;
}
