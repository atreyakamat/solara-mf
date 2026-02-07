## Packages
recharts | For financial charts (NAV history, portfolio projections)
framer-motion | For smooth page transitions and interactive elements
date-fns | For date formatting in charts and lists
clsx | Utility for conditional classes
tailwind-merge | Utility for merging tailwind classes

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
}
The app uses a Sidebar layout.
Chat interface connects to /api/conversations endpoints with SSE streaming.
Funds and Portfolio data fetched via standard REST endpoints.
