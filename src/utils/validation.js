/**
 * Validation Schemas
 *
 * Provides validation schemas for user inputs using Yup.
 * Ensures data integrity and security before processing.
 */

import * as Yup from 'yup';

/**
 * Roadmap validation schema
 */
export const roadmapSchema = Yup.object().shape({
  name: Yup.string()
    .required('Roadmap name is required')
    .min(3, 'Roadmap name must be at least 3 characters')
    .max(100, 'Roadmap name must be less than 100 characters')
    .trim(),

  goal: Yup.string()
    .required('Goal is required')
    .min(5, 'Goal must be at least 5 characters')
    .max(500, 'Goal must be less than 500 characters')
    .trim(),

  budget: Yup.number()
    .positive('Budget must be a positive number')
    .max(100000000, 'Budget seems unrealistic')
    .nullable(),

  target_date: Yup.date()
    .nullable()
    .min(new Date(), 'Target date must be in the future'),

  location: Yup.string()
    .max(200, 'Location must be less than 200 characters')
    .nullable(),
});

/**
 * Milestone validation schema
 */
export const milestoneSchema = Yup.object().shape({
  title: Yup.string()
    .required('Milestone title is required')
    .min(3, 'Milestone title must be at least 3 characters')
    .max(200, 'Milestone title must be less than 200 characters')
    .trim(),

  description: Yup.string()
    .max(1000, 'Description must be less than 1000 characters')
    .nullable(),

  budget: Yup.number()
    .positive('Budget must be a positive number')
    .nullable(),

  target_date: Yup.date()
    .nullable(),

  order_index: Yup.number()
    .integer('Order must be an integer')
    .min(0, 'Order must be non-negative')
    .required('Order index is required'),
});

/**
 * Task validation schema
 */
export const taskSchema = Yup.object().shape({
  title: Yup.string()
    .required('Task title is required')
    .min(3, 'Task title must be at least 3 characters')
    .max(200, 'Task title must be less than 200 characters')
    .trim(),

  description: Yup.string()
    .max(1000, 'Description must be less than 1000 characters')
    .nullable(),

  completed: Yup.boolean()
    .default(false),

  assigned_to: Yup.string()
    .uuid('Invalid user ID')
    .nullable(),

  estimated_hours: Yup.number()
    .positive('Estimated hours must be positive')
    .max(10000, 'Estimated hours seems unrealistic')
    .nullable(),
});

/**
 * Expense validation schema
 */
export const expenseSchema = Yup.object().shape({
  title: Yup.string()
    .required('Expense title is required')
    .min(3, 'Expense title must be at least 3 characters')
    .max(200, 'Expense title must be less than 200 characters')
    .trim(),

  amount: Yup.number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .max(100000000, 'Amount seems unrealistic'),

  category: Yup.string()
    .max(100, 'Category must be less than 100 characters')
    .nullable(),

  status: Yup.string()
    .oneOf(['pending', 'paid', 'overdue'], 'Invalid status')
    .default('pending'),

  due_date: Yup.date()
    .nullable(),

  expense_date: Yup.date()
    .max(new Date(), 'Expense date cannot be in the future')
    .nullable(),
});

/**
 * User profile validation schema
 */
export const userProfileSchema = Yup.object().shape({
  display_name: Yup.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .trim()
    .nullable(),

  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required')
    .trim()
    .lowercase(),

  phone: Yup.string()
    .matches(/^[+]?[\d\s\-()]+$/, 'Invalid phone number format')
    .max(20, 'Phone number must be less than 20 characters')
    .nullable(),
});

/**
 * Luna message validation schema
 */
export const lunaMessageSchema = Yup.object().shape({
  content: Yup.string()
    .required('Message cannot be empty')
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message must be less than 5000 characters')
    .trim(),

  role: Yup.string()
    .oneOf(['user', 'assistant'], 'Invalid role')
    .required('Role is required'),
});

/**
 * Partner invitation schema
 */
export const partnerInvitationSchema = Yup.object().shape({
  partner_email: Yup.string()
    .email('Invalid email address')
    .required('Partner email is required')
    .trim()
    .lowercase(),

  roadmap_id: Yup.string()
    .uuid('Invalid roadmap ID')
    .required('Roadmap ID is required'),
});

/**
 * Compatibility answer schema
 */
export const compatibilityAnswerSchema = Yup.object().shape({
  question_id: Yup.string()
    .required('Question ID is required'),

  answer: Yup.mixed()
    .required('Answer is required'),

  partner_role: Yup.string()
    .oneOf(['partner1', 'partner2'], 'Invalid partner role')
    .required('Partner role is required'),
});

/**
 * Validates data against a schema
 * @param {Object} schema - Yup validation schema
 * @param {any} data - Data to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validated and sanitized data
 * @throws {ValidationError} If validation fails
 */
export const validate = async (schema, data, options = {}) => {
  try {
    const validated = await schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      ...options
    });
    return { success: true, data: validated, errors: null };
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      const errors = error.inner.reduce((acc, err) => {
        acc[err.path] = err.message;
        return acc;
      }, {});
      return { success: false, data: null, errors };
    }
    throw error;
  }
};

/**
 * Validates data and throws if invalid
 * @param {Object} schema - Yup validation schema
 * @param {any} data - Data to validate
 * @returns {Promise<Object>} Validated data
 * @throws {ValidationError} If validation fails
 */
export const validateOrThrow = async (schema, data) => {
  return await schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
};

export default {
  roadmapSchema,
  milestoneSchema,
  taskSchema,
  expenseSchema,
  userProfileSchema,
  lunaMessageSchema,
  partnerInvitationSchema,
  compatibilityAnswerSchema,
  validate,
  validateOrThrow
};
