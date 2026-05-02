// Root redirect handled by next.config.ts redirects (edge-level, no serverless function).
// This file kept as fallback only — next.config.ts redirect takes priority.
export default function HomePage() {
  return null;
}