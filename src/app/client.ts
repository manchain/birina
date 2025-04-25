import { createThirdwebClient } from "thirdweb";

// Replace this with your client ID string
// refer to https://portal.thirdweb.com/typescript/v5/client on how to get a client ID
const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "YOUR_THIRDWEB_CLIENT_ID";

// Default to a test client ID if none provided
// In production, always use an environment variable for security
const fallbackClientId = "test-client-id-for-dev-only";

// Use the provided client ID or fallback to a test ID
const effectiveClientId = clientId !== "a0cc698f15ff8bd5cdbce72c2d70f7e" ? clientId : fallbackClientId;

export const client = createThirdwebClient({
  clientId: effectiveClientId,
});
