import {
  anonymousClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "@/lib/auth";

// Browser-side auth calls go through /api/auth, so Better Auth's rate
// limiting applies to them.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), anonymousClient()],
});
