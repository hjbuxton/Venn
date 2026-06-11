/**
 * Builds a Booking.com search results URL with CJ affiliate tracking.
 */
export function buildBookingUrl({
  destination,
  checkin,
  checkout,
}: {
  destination: string;
  checkin?: string;
  checkout?: string;
}) {
  const aid = process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID || "0";

  const params = new URLSearchParams({
    ss: destination,
    aid,
  });

  if (checkin) params.set("checkin", checkin);
  if (checkout) params.set("checkout", checkout);

  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}
