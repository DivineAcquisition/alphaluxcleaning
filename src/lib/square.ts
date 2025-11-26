import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window {
    Square?: any;
  }
}

let squareInstancePromise: Promise<any> | null = null;

const isValidKey = (key: string | undefined): key is string => {
  return typeof key === "string" && key.startsWith("sq0idp-") && key.length > 20;
};

async function fetchSquareConfig(): Promise<{ applicationId: string; locationId: string } | null> {
  try {
    console.log("🔑 Fetching Square configuration from Supabase...");
    
    const { data, error } = await supabase.functions.invoke("get-square-config");
    
    if (error) {
      console.error("❌ Error fetching Square config:", error);
      return null;
    }
    
    if (!data?.applicationId || !isValidKey(data.applicationId)) {
      console.error("❌ Invalid Square Application ID received");
      return null;
    }
    
    console.log("✅ Square configuration retrieved successfully");
    return { applicationId: data.applicationId, locationId: data.locationId };
  } catch (err) {
    console.error("❌ Failed to fetch Square configuration:", err);
    return null;
  }
}

async function loadSquareSDK(): Promise<void> {
  if (window.Square) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://web.squarecdn.com/v1/square.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Square SDK"));
    document.head.appendChild(script);
  });
}

async function createSquareInstance() {
  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 Square initialization attempt ${attempt}/${maxAttempts}`);

      // Load Square SDK
      await loadSquareSDK();

      if (!window.Square) {
        throw new Error("Square SDK not loaded");
      }

      // Fetch configuration
      const config = await fetchSquareConfig();
      
      if (!config?.applicationId) {
        throw new Error("Square Application ID not configured");
      }

      // Initialize Square Payments
      const payments = window.Square.payments(config.applicationId, config.locationId);
      
      console.log("✅ Square initialized successfully");
      return { payments, config };
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Square initialization attempt ${attempt} failed:`, error);
      
      if (attempt < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error("❌ Square initialization failed after all attempts");
  toast.error("Payment system initialization failed. Please refresh the page or contact support.", {
    duration: 10000,
  });
  
  throw lastError || new Error("Failed to initialize Square");
}

/**
 * Initialize Square SDK explicitly (useful for lazy loading)
 * Returns the Square instance promise
 */
export const initializeSquare = () => {
  if (!squareInstancePromise) {
    console.log('🔄 Initializing Square SDK on demand...');
    squareInstancePromise = createSquareInstance();
  }
  return squareInstancePromise;
};

// Initialize Square on module load (for backward compatibility)
if (typeof window !== "undefined") {
  squareInstancePromise = createSquareInstance();
}

export const squarePromise = squareInstancePromise;

export function resetSquarePromise() {
  console.log("🔄 Resetting Square promise for retry...");
  squareInstancePromise = createSquareInstance();
  return squareInstancePromise;
}

export async function hasSquareKey(): Promise<boolean> {
  try {
    const square = await squarePromise;
    return !!square?.config?.applicationId;
  } catch {
    return false;
  }
}

export function getSquarePromise() {
  return squarePromise;
}

export async function checkSquareReady(): Promise<boolean> {
  try {
    await squarePromise;
    return true;
  } catch {
    return false;
  }
}
