export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/** Currency symbol matching the formatter above (e.g. "$"). */
export function getCurrencySymbol() {
  return (
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? "$"
  );
}
