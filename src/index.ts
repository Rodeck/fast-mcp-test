import { FastMCP } from "fastmcp";
import { z } from "zod";
import { GoogleProvider } from "fastmcp/auth";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Environment variable validation schema
const envSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  BASE_URL: z.string().url("BASE_URL must be a valid URL"),
  PORT: z.string().optional().default("8080").transform(Number),
});

// Validate environment variables
const env = envSchema.parse({
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  BASE_URL: process.env.BASE_URL,
  PORT: process.env.PORT,
});

const authProxy = new GoogleProvider({
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  baseUrl: env.BASE_URL,
  scopes: ["openid", "profile", "email"],
});

const server = new FastMCP({
  name: "My Server",
  version: "1.0.0",
  oauth: {
    enabled: true,
    authorizationServer: authProxy.getAuthorizationServerMetadata(),
    proxy: authProxy, // Routes automatically registered!
  },
});

server.addTool({
  name: "add",
  description: "Add two numbers",
  parameters: z.object({
    a: z.number(),
    b: z.number(),
  }),
  execute: async (args) => {
    return String(args.a + args.b);
  },
});

server.start({
  transportType: "httpStream",
  httpStream: {
    port: env.PORT,
    host: "0.0.0.0",
  }
});

console.log(`Server starting on http://0.0.0.0:${env.PORT}/mcp`);
