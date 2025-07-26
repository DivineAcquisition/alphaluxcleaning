import { useSearchParams } from "react-router-dom";
import { PostPaymentForm } from "@/components/PostPaymentForm";
import { Navigation } from "@/components/Navigation";
import { PublicFooter } from "@/components/footer/PublicFooter";

export default function ServiceDetails() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex flex-col">
      <Navigation />
      
      <div className="container mx-auto max-w-4xl py-8 px-4 flex-1">
        <PostPaymentForm sessionId={sessionId || undefined} />
      </div>
      
      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}