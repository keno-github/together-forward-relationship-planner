/**
 * Form Validation Hook
 *
 * Custom React hook that combines validation and sanitization
 * for form inputs. Provides real-time validation and error handling.
 */

import { useState, useCallback } from 'react';
import { validate } from '../utils/validation';
import { sanitizeUserInput } from '../utils/sanitization';

/**
 * Custom hook for form validation and sanitization
 * @param {Object} schema - Yup validation schema
 * @param {Object} initialValues - Initial form values
 * @param {Function} onSubmit - Submit callback function
 * @returns {Object} Form state and handlers
 */
export const useFormValidation = (schema, initialValues = {}, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  /**
   * Handles input change with sanitization
   */
  const handleChange = useCallback((name, value, shouldSanitize = true) => {
    // Sanitize string inputs
    const sanitizedValue = shouldSanitize && typeof value === 'string'
      ? sanitizeUserInput(value)
      : value;

    setValues(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Clear error for this field
    setErrors(prev => ({
      ...prev,
      [name]: undefined
    }));
  }, []);

  /**
   * Handles input blur (marks field as touched)
   */
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);

  /**
   * Validates a single field
   */
  const validateField = useCallback(async (name, value) => {
    try {
      await schema.validateAt(name, { [name]: value });
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
      return true;
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error.message
      }));
      return false;
    }
  }, [schema]);

  /**
   * Validates all fields
   */
  const validateAll = useCallback(async () => {
    const result = await validate(schema, values);

    if (result.success) {
      setErrors({});
      setIsValid(true);
      return true;
    } else {
      setErrors(result.errors);
      setIsValid(false);
      return false;
    }
  }, [schema, values]);

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback(async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    setIsSubmitting(true);

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Validate all fields
    const isValid = await validateAll();

    if (isValid && onSubmit) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
        setErrors(prev => ({
          ...prev,
          submit: error.message || 'Submission failed'
        }));
      }
    }

    setIsSubmitting(false);
  }, [values, validateAll, onSubmit]);

  /**
   * Resets form to initial values
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValid(false);
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Sets multiple values at once
   */
  const setFieldValues = useCallback((newValues) => {
    setValues(prev => ({
      ...prev,
      ...newValues
    }));
  }, []);

  /**
   * Sets error for a specific field
   */
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  /**
   * Clears all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    // Form state
    values,
    errors,
    touched,
    isSubmitting,
    isValid,

    // Form handlers
    handleChange,
    handleBlur,
    handleSubmit,
    validateField,
    validateAll,
    reset,

    // Setters
    setFieldValues,
    setFieldError,
    clearErrors,
    setValues,
  };
};

/**
 * Simple validation hook for individual inputs
 * @param {Function} validationFn - Validation function
 * @param {any} value - Value to validate
 * @param {boolean} immediate - Validate immediately
 * @returns {Object} Validation state
 */
export const useInputValidation = (validationFn, value, immediate = false) => {
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async () => {
    setIsValidating(true);
    try {
      await validationFn(value);
      setError(null);
      setIsValidating(false);
      return true;
    } catch (err) {
      setError(err.message);
      setIsValidating(false);
      return false;
    }
  }, [validationFn, value]);

  // Validate immediately if requested
  if (immediate && value && !error) {
    validate();
  }

  return {
    error,
    isValidating,
    validate
  };
};

export default useFormValidation;
