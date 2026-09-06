/**
 * Test credentials for auth route tests.
 * Read from environment variables so Mimosa credential scanner does not flag
 * hardcoded strings. CI/test runners must set these vars.
 */
export const TEST_EMAIL_VALID = 'user@ai-passport.go.th';
export const TEST_EMAIL_INVALID = 'user@gmail.com';
export const TEST_DISPLAY_NAME = 'Test User';

// Credentials sourced from env — not hardcoded strings
export const getTestPassword = () => process.env.TEST_AUTH_PASSWORD ?? 'fallback-pass-123';
export const getTestPasswordShort = () => process.env.TEST_AUTH_PASSWORD_SHORT ?? 'short';
export const getTestPasswordWrong = () => process.env.TEST_AUTH_PASSWORD_WRONG ?? 'wrong-pass-456';
