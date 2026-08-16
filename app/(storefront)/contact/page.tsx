import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ContactView from "@/components/ContactView";

/** New page — the original Medical_Product SPA had no Contact Us page.
 * Routes logged-in users to the real ticket system at /support (customer_queries
 * table) rather than duplicating a second fake contact form here. */
export default async function ContactPage() {
  const session = await getServerSession(authOptions);
  return <ContactView isSignedIn={Boolean(session?.user)} />;
}
