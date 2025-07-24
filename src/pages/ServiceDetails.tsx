import { useSearchParams } from "react-router-dom";
import { PostPaymentForm } from "@/components/PostPaymentForm";

export default function ServiceDetails() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-2 sm:p-4">
      <div className="container mx-auto max-w-4xl py-4 sm:py-8">
        <PostPaymentForm 
          sessionId={sessionId || undefined}
          onComplete={() => {
            // Redirect to success or home page after completion
            window.location.href = "/";
          }}
        />
      </div>
    </div>
  );
}