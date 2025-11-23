# Security Policy

## Overview

TogetherForward takes security seriously. This document outlines our security practices and guidelines for developers and users.

## Environment Security

### API Keys and Secrets

**CRITICAL:** Never commit API keys, passwords, or other secrets to version control.

✅ **DO:**
- Keep all secrets in `.env` file (already in `.gitignore`)
- Use `.env.example` as a template
- Rotate API keys regularly
- Use environment-specific keys (development vs. production)

❌ **DON'T:**
- Hardcode API keys in source code
- Commit `.env` file to git
- Share API keys in chat/email
- Use production keys in development

### Configuration Validation

The application validates environment variables on startup:

**Backend** (`src/config/serverEnv.js`):
- Validates `CLAUDE_API_KEY` is present and properly formatted
- Checks for placeholder values
- Logs configuration with masked secrets

**Frontend** (`src/config/env.js`):
- Validates Supabase and backend URLs
- Ensures proper URL formats
- Warns if production app isn't using HTTPS

If validation fails, the application will not start.

## CORS (Cross-Origin Resource Sharing)

### Development
Allows requests from localhost on ports 3000, 3001, 3006

### Production
Set `ALLOWED_ORIGINS` environment variable with comma-separated list:
```
ALLOWED_ORIGINS=https://togetherforward.com,https://www.togetherforward.com
```

## Supabase Security

### Row Level Security (RLS)

All Supabase tables MUST have RLS policies enabled. See `supabase_schema.sql` for policy definitions.

**Key Policies:**
- Users can only access their own roadmaps
- Partners can access shared roadmaps via `partner_id`
- Tasks and milestones inherit roadmap permissions

### Anonymous Key

The `REACT_APP_SUPABASE_ANON_KEY` is safe to expose in frontend code. It's a public key that only grants permissions defined by RLS policies.

**DO NOT expose:**
- Supabase service role key
- Supabase database password

## Input Validation

### Current Status
⚠️ **In Progress:** Comprehensive input sanitization layer being implemented

### Planned Security Measures
1. **XSS Protection:** DOMPurify for HTML sanitization
2. **SQL Injection:** Parameterized queries (Supabase handles this)
3. **Schema Validation:** Yup/Zod for form validation

## Authentication

### Session Management

- Sessions stored in localStorage (Supabase default)
- Auto-refresh tokens enabled
- Session expires after inactivity

### Future Improvements
- [ ] Implement token rotation
- [ ] Add session timeout warnings
- [ ] Consider httpOnly cookies for enhanced security

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please email: [your-security-email]

**Please do NOT:**
- Open a public GitHub issue
- Share details publicly before fix is released

## Security Checklist for Deployment

Before deploying to production:

- [ ] All environment variables set in production
- [ ] `.env` file not committed to git
- [ ] CORS configured for production domain only
- [ ] HTTPS enabled for frontend and backend
- [ ] Supabase RLS policies tested and enabled
- [ ] API keys rotated from development
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Rate limiting enabled on backend
- [ ] Input validation implemented
- [ ] Dependency vulnerabilities checked (`npm audit`)

## Development Security Tools

### Available Scripts

```bash
# Check for security vulnerabilities in dependencies
npm audit

# Fix automatically fixable vulnerabilities
npm audit fix

# Future: Run security scanner
# npm run security-scan
```

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Anthropic API Security](https://docs.anthropic.com/en/api/getting-started#authentication)

## Version History

- **2025-11-14:** Initial security documentation
  - Environment validation added
  - CORS configuration improved
  - Security checklist created
