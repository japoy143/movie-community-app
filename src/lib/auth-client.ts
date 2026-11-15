import { createAuthClient } from "better-auth/react";

// For Client Components. Same-origin, so no baseURL is needed.
export const authClient = createAuthClient();
