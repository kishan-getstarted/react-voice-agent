import "dotenv/config";
import { type WebSocket } from "ws";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import { serveStatic } from "@hono/node-server/serve-static";

import { OpenAIVoiceReactAgent } from "./lib/langchain_openai_voice";
import { INSTRUCTIONS } from "./prompt";
import { TOOLS } from "./tools";
import { WSContext } from "hono/ws";

const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.use("/", serveStatic({ path: "./static/index.html" }));
app.use("/static/*", serveStatic({ root: "./" }));

app.get(
  "/ws",
  upgradeWebSocket((c) => ({
    onOpen: async (evt: Event, ws: WSContext<unknown>) => {
      let instructions = "";
      if (!process.env.OPENAI_API_KEY) {
        return ws.close();
      }

      let context = "";

      (ws.raw as WebSocket).on("message", async (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === "set_context") {
            context = data.context;
            console.log("kishan", context);
            // Update agent instructions with the new context
            instructions += `You are an AI assistant that operates strictly within provided context. Your knowledge is limited to ONLY what is explicitly shared in the current context.
            CURRENT CONTEXT: ${context}
                        BEHAVIORAL RULES:
            1. ONLY answer using information from the CURRENT CONTEXT above
            2. Keep all responses concise.
            3. If asked anything not explicitly mentioned in the context, respond: "I don't have that specific information in my current context."
            4. Never make assumptions or add external knowledge
            5. Don't try to guess or infer information beyond the context
            6. Be direct and factual in responses
            7. If something is ambiguous, admit you don't have enough context to answer
            8. For any real-time or current information requests (prices, timings, etc.), respond: "I cannot provide current information as my context is limited to the specific details provided."

            Example responses:
            - If information is in context: Provide the specific information, citing exactly what's mentioned
            - If information is not in context: "I don't have that specific information in my current context."
            - If asked about current/real-time info: "I cannot provide current information as my context is limited to the specific details provided."
            `;
            console.log("instructions", instructions);
            const agent = new OpenAIVoiceReactAgent({
              instructions: instructions,
              tools: TOOLS,
              model: "gpt-4o-realtime-preview",
            });

            await agent.connect(ws.raw as WebSocket, ws.send.bind(ws));
          }
        } catch (error) {
          console.error("Error processing message:", error);
        }
      });
    },
    onClose: () => {
      console.log("CLOSING");
    },
  }))
);

const port = 3000;

const server = serve({
  fetch: app.fetch,
  port,
});

injectWebSocket(server);

console.log(`Server is running on port ${port}`);
