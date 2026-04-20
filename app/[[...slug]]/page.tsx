import ClientApp from "../ClientApp";

export const dynamic = "force-dynamic";

/**
 * Catch-all route that forwards every path to the existing React SPA.
 * React Router inside ClientApp handles actual routing client-side.
 */
export default function Page() {
  return <ClientApp />;
}
