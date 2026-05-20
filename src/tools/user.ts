import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AngelOneAPI } from "@/api.js";
import type { ProfileData } from "@/types.js";

export function registerUserTools(server: McpServer, api: AngelOneAPI): void {
  server.registerTool(
    "get_profile",
    {
      description:
        "Get Angel One user profile: name, email, mobile, exchanges, products, broker info.",
      annotations: { openWorldHint: true },
    },
    async () => {
      try {
        const data = await api.getProfile<ProfileData>();
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: true, data }, null, 2),
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
