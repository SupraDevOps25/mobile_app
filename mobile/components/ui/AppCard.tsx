// The shared card surface: hairline border + soft shadow. Spread onto any white
// card so every account's cards share one consistent look (padding/size stays
// each card's own — only the border and shadow are unified).
export const CARD_SURFACE = {
  borderWidth: 1,
  borderColor: "#ebedf0",
  shadowColor: "#0f172a",
  shadowOpacity: 0.04,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
} as const;
