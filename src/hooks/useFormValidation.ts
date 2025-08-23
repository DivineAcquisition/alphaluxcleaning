import { useState, useCallback } from 'react';
import { 
  validatePhoneNumber, 
  validateZipCode, 
  validateEmail, 
  validateName 
} from '@/lib/validation-utils';
import { validateServiceAreaZipCode } from '@/lib/service-area-validation';

interface ValidationError {
  field: string;
  message: string;
}

interface FormValidationHook {
  errors: ValidationError[];
  validateField: (field: string, value: any, formData?: any) => boolean;
  validateForm: (formData: any) => boolean;
  clearErrors: () => void;
  hasError: (field: string) => boolean;
  getError: (field: string) => string | undefined;
}

export const useFormValidation = (): FormValidationHook => {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const addError = useCallback((field: string, message: string) => {
    setErrors(prev => {
      const filtered = prev.filter(error => error.field !== field);
      return [...filtered, { field, message }];
    });
  }, []);

  const removeError = useCallback((field: string) => {
    setErrors(prev => prev.filter(error => error.field !== field));
  }, []);

  const validateField = useCallback((field: string, value: any, formData?: any): boolean => {
    switch (field) {
      case 'full_name':
      case 'emergency_contact_name':
        const nameValidation = validateName(value);
        if (!nameValidation.isValid) {
          addError(field, nameValidation.message!);
          return false;
        }
        break;

      case 'email':
        const emailValidation = validateEmail(value);
        if (!emailValidation.isValid) {
          addError(field, emailValidation.message!);
          return false;
        }
        break;

      case 'phone':
      case 'emergency_contact_phone':
        if (value && value.trim()) {
          const phoneValidation = validatePhoneNumber(value);
          if (!phoneValidation.isValid) {
            addError(field, phoneValidation.message!);
            return false;
          }
        }
        break;

      case 'zip_code':
        if (value && value.trim()) {
          const zipValidation = validateZipCode(value);
          if (!zipValidation.isValid) {
            addError(field, zipValidation.message!);
            return false;
          }
        }
        break;

      case 'service_zip_code':
        if (value && value.trim()) {
          const serviceAreaValidation = validateServiceAreaZipCode(value);
          if (!serviceAreaValidation.isValid) {
            addError(field, serviceAreaValidation.message!);
            return false;
          }
        }
        break;

      case 'why_join_us':
        if (!value || value.trim().length < 10) {
          addError(field, 'Please provide at least 10 characters explaining why you want to join us');
          return false;
        }
        break;

      case 'availability':
        if (!value) {
          addError(field, 'Please select your availability');
          return false;
        }
        break;

      case 'has_drivers_license':
        if (!value) {
          addError(field, 'A valid driver\'s license is required for this position');
          return false;
        }
        break;

      case 'has_own_vehicle':
        if (!value) {
          addError(field, 'Having your own vehicle is required for this position');
          return false;
        }
        break;

      case 'drivers_license_image_url':
        if (formData?.has_drivers_license && !value) {
          addError(field, 'Please upload a photo of your driver\'s license');
          return false;
        }
        break;

      case 'background_check_consent':
      case 'brand_shirt_consent':
      case 'subcontractor_agreement_consent':
        if (!value) {
          addError(field, 'This consent is required to proceed');
          return false;
        }
        break;
    }

    removeError(field);
    return true;
  }, [addError, removeError]);

  const validateForm = useCallback((formData: any): boolean => {
    const requiredFields = [
      'full_name', 'email', 'phone', 'why_join_us', 'availability',
      'emergency_contact_name', 'emergency_contact_phone'
    ];

    let isValid = true;

    // Validate all required fields
    requiredFields.forEach(field => {
      if (!validateField(field, formData[field], formData)) {
        isValid = false;
      }
    });

    // Validate optional fields if they have values
    ['zip_code'].forEach(field => {
      if (formData[field]) {
        if (!validateField(field, formData[field], formData)) {
          isValid = false;
        }
      }
    });

    // Validate mandatory requirements
    ['has_drivers_license', 'has_own_vehicle'].forEach(field => {
      if (!validateField(field, formData[field], formData)) {
        isValid = false;
      }
    });

    // Validate driver's license image
    if (!validateField('drivers_license_image_url', formData.drivers_license_image_url, formData)) {
      isValid = false;
    }

    // Validate consents
    ['background_check_consent', 'brand_shirt_consent', 'subcontractor_agreement_consent'].forEach(field => {
      if (!validateField(field, formData[field], formData)) {
        isValid = false;
      }
    });

    return isValid;
  }, [validateField]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const hasError = useCallback((field: string): boolean => {
    return errors.some(error => error.field === field);
  }, [errors]);

  const getError = useCallback((field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  }, [errors]);

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    hasError,
    getError
  };
};