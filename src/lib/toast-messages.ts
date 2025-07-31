import { CheckCircle, Info, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";

// Enhanced toast notifications with consistent styling and actions
export const showSuccessToast = (title: string, description?: string, action?: () => void) => {
  toast.success(title, {
    description,
    duration: 4000,
    action: action ? {
      label: "View",
      onClick: action,
    } : undefined,
  });
};

export const showErrorToast = (title: string, description?: string, action?: () => void) => {
  toast.error(title, {
    description,
    duration: 6000,
    action: action ? {
      label: "Retry",
      onClick: action,
    } : undefined,
  });
};

export const showInfoToast = (title: string, description?: string, action?: () => void) => {
  toast.info(title, {
    description,
    duration: 4000,
    action: action ? {
      label: "Learn More",
      onClick: action,
    } : undefined,
  });
};

export const showWarningToast = (title: string, description?: string, action?: () => void) => {
  toast.warning(title, {
    description,
    duration: 5000,
    action: action ? {
      label: "Fix Now",
      onClick: action,
    } : undefined,
  });
};

// Application-specific toast messages
export const applicationToasts = {
  validation: {
    licenseRequired: () => showErrorToast(
      "Driver's License Required", 
      "You must have a valid driver's license to apply for this position."
    ),
    vehicleRequired: () => showErrorToast(
      "Vehicle Required", 
      "You must have your own reliable vehicle to apply for this position."
    ),
    licenseImageRequired: () => showErrorToast(
      "License Photo Required", 
      "Please upload a clear photo of your driver's license."
    ),
    allFieldsRequired: () => showErrorToast(
      "Missing Information", 
      "Please fill in all required fields before submitting."
    ),
    consentRequired: () => showErrorToast(
      "Consent Required", 
      "Please provide all required consents to proceed."
    ),
  },
  
  submission: {
    success: () => showSuccessToast(
      "Application Submitted!", 
      "Your application has been submitted successfully. We'll review it and get back to you soon.",
      () => window.location.reload()
    ),
    error: (message?: string) => showErrorToast(
      "Submission Failed", 
      message || "Failed to submit your application. Please try again.",
      () => window.location.reload()
    ),
  },

  upload: {
    success: () => showSuccessToast(
      "File Uploaded", 
      "Your file has been uploaded successfully."
    ),
    error: (message?: string) => showErrorToast(
      "Upload Failed", 
      message || "Failed to upload file. Please try again."
    ),
    sizeError: () => showErrorToast(
      "File Too Large", 
      "File size must be less than 5MB. Please choose a smaller file."
    ),
    typeError: () => showErrorToast(
      "Invalid File Type", 
      "Please select a valid image file (JPG, PNG, etc.)."
    ),
  },

  onboarding: {
    welcomeSuccess: () => showSuccessToast(
      "Welcome to the Team!", 
      "Your onboarding is complete. You can now start accepting jobs."
    ),
    profileRequired: () => showWarningToast(
      "Profile Setup Required", 
      "Please upload a profile photo and write a biography for customers to see."
    ),
    bankingRequired: () => showWarningToast(
      "Banking Information Required", 
      "Please provide your banking details to receive payments."
    ),
    paymentProcessing: () => showInfoToast(
      "Processing Payment", 
      "Redirecting you to secure payment processing..."
    ),
  },

  auth: {
    loginRequired: () => showWarningToast(
      "Login Required", 
      "Please log in to access your dashboard.",
      () => window.location.href = "/auth"
    ),
    sessionExpired: () => showWarningToast(
      "Session Expired", 
      "Your session has expired. Please log in again.",
      () => window.location.href = "/auth"
    ),
  }
};