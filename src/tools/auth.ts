import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AngelOneAPI } from "@/api.js";

export function registerAuthTools(server: McpServer, api: AngelOneAPI): void {
  server.registerTool(
    "login",
    {
      description:
        "Authenticate with Angel One SmartAPI. Auto-generates TOTP. Stores session internally.",
      annotations: { openWorldHint: true },
    },
    async () => {
      try {
        await api.login();
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: "Login successful",
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "logout",
    {
      description: "End Angel One SmartAPI session and invalidate tokens.",
      annotations: { openWorldHint: true },
    },
    async () => {
      try {
        await api.logout();
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: true, message: "Logged out" }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
