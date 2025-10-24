/**
 * Auth helper utilities
 */

/**
 * Check if error message indicates user already exists via OAuth
 */
export function isOAuthUserExistsError(errorMessage: string): boolean {
  const oauthErrorPatterns = [
    "already registered",
    "already been registered",
    "User already registered",
    "email already exists",
    "duplicate key value",
  ];

  return oauthErrorPatterns.some((pattern) =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Get user-friendly error message for auth errors
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred";

  const message = error.message || error.toString();

  // OAuth user trying to sign up with password
  if (isOAuthUserExistsError(message)) {
    return "This email is already registered. Please sign in with Google or use the 'Forgot password?' option to set a password.";
  }

  // Invalid credentials
  if (message.includes("Invalid login credentials")) {
    return "Invalid email or password. Please try again.";
  }

  // Email not confirmed
  if (message.includes("Email not confirmed")) {
    return "Please verify your email address. Check your inbox for the confirmation link.";
  }

  // Weak password
  if (message.includes("Password should be at least")) {
    return "Password must be at least 6 characters long.";
  }

  // Default: return original message
  return message;
}
