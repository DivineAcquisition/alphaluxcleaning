/**
 * Validation utilities for form inputs
 */

// Phone number validation for US format
export const validatePhoneNumber = (phone: string): { isValid: boolean; message?: string } => {
  // Remove all non-digits
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number (10 digits, optionally starting with 1)
  if (digitsOnly.length === 10) {
    return { isValid: true };
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return { isValid: true };
  } else {
    return { 
      isValid: false, 
      message: 'Please enter a valid US phone number (e.g., (555) 123-4567)' 
    };
  }
};

// Format phone number to (XXX) XXX-XXXX format
export const formatPhoneNumber = (phone: string): string => {
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length >= 10) {
    const areaCode = digitsOnly.slice(-10, -7);
    const prefix = digitsOnly.slice(-7, -4);
    const number = digitsOnly.slice(-4);
    return `(${areaCode}) ${prefix}-${number}`;
  }
  
  return phone;
};

// ZIP code validation for US format
export const validateZipCode = (zipCode: string): { isValid: boolean; message?: string } => {
  // US ZIP code pattern: 5 digits or 5 digits + 4 digits (XXXXX or XXXXX-XXXX)
  const zipPattern = /^\d{5}(-\d{4})?$/;
  
  if (zipPattern.test(zipCode.trim())) {
    return { isValid: true };
  } else {
    return {
      isValid: false,
      message: 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)'
    };
  }
};

// Enhanced email validation
export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  // More comprehensive email regex
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  const trimmedEmail = email.trim();
  
  if (!trimmedEmail) {
    return { isValid: false, message: 'Email is required' };
  } else if (!emailPattern.test(trimmedEmail)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  } else if (trimmedEmail.length > 254) {
    return { isValid: false, message: 'Email address is too long' };
  } else {
    return { isValid: true };
  }
};

// Sanitize text inputs to prevent basic injection attempts
export const sanitizeTextInput = (input: string): string => {
  return input
    .trim()
    // Remove null bytes and control characters except tabs and newlines
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Limit length to prevent abuse
    .slice(0, 1000);
};

// Sanitize address inputs
export const sanitizeAddress = (address: string): string => {
  return address
    .trim()
    // Remove potentially dangerous characters while keeping necessary punctuation
    .replace(/[<\\"'`]/g, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    .slice(0, 200);
};

// Name validation
export const validateName = (name: string): { isValid: boolean; message?: string } => {
  const sanitized = sanitizeTextInput(name);
  
  if (!sanitized) {
    return { isValid: false, message: 'Name is required' };
  } else if (sanitized.length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long' };
  } else if (!/^[\p{L}\p{M}\s.'-]+$/u.test(sanitized)) {
    return { isValid: false, message: 'Name contains invalid characters' };
  } else {
    return { isValid: true };
  }
};

// Business name validation
export const validateBusinessName = (name: string): { isValid: boolean; message?: string } => {
  const sanitized = sanitizeTextInput(name);
  
  if (!sanitized) {
    return { isValid: false, message: 'Business name is required' };
  } else if (sanitized.length < 2) {
    return { isValid: false, message: 'Business name must be at least 2 characters long' };
  } else {
    return { isValid: true };
  }
};
