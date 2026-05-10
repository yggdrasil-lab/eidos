import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Pool } from 'pg';
import fs from 'fs';

const PORT = process.env.PORT || 3000;

async function main() {
  const dbUser = process.env.POSTGRES_USER;
  const dbName = process.env.POSTGRES_DB;
  if (!dbUser || !dbName) throw new Error("Missing POSTGRES_USER or POSTGRES_DB environment variables");

  const secretPath = '/run/secrets/eidos_postgres_password';
  if (!fs.existsSync(secretPath)) throw new Error(`Missing postgres password secret file at ${secretPath}`);
  const dbPass = fs.readFileSync(secretPath, 'utf8').trim();

  const pool = new Pool({
    connectionString: `postgres://${dbUser}:${dbPass}@eidos-db:5432/${dbName}`
  });

  // Note: Schema initialization is handled by Postgres container automatically via docker-entrypoint-initdb.d
  // so we don't need to manually read and execute init.sql here anymore!
  
  const app = express();
  
  const server = new Server({
    name: "eidos-mcp",
    version: "1.0.0"
  }, {
    capabilities: { tools: {} }
  });

  let transport: SSEServerTransport | null = null;

  app.get('/sse', async (req, res) => {
    transport = new SSEServerTransport('/message', res);
    await server.connect(transport);
    console.log('[Eidos] MCP Client connected via SSE');
  });

  app.post('/message', async (req, res) => {
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(503).send('SSE not initialized');
    }
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "query_eidos",
          description: "Run an SQL query against the Postgres Eidos database.",
          inputSchema: {
            type: "object",
            properties: {
              sql: { type: "string" }
            },
            required: ["sql"]
          }
        },
        {
          name: "insert_eidos_event",
          description: "Insert a new event payload into the Eidos database.",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string" },
              domain: { type: "string", description: "e.g., 'wealth', 'health'" },
              type: { type: "string", description: "e.g., 'expense', 'weight'" },
              data: { type: "string", description: "The JSON string representation of the payload" }
            },
            required: ["id", "domain", "type", "data"]
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "query_eidos") {
      const sql = String(request.params.arguments?.sql);
      try {
        const result = await pool.query(sql);
        return {
          content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }]
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `SQL Error: ${err.message}` }],
          isError: true
        };
      }
    }
    
    if (request.params.name === "insert_eidos_event") {
      const { id, domain, type, data } = request.params.arguments as any;
      try {
        await pool.query(
          'INSERT INTO events (id, domain, type, data) VALUES ($1, $2, $3, $4)',
          [id, domain, type, data]
        );
        return {
          content: [{ type: "text", text: `Successfully inserted event ${id} into ${domain}` }]
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Insert Error: ${err.message}` }],
          isError: true
        };
      }
    }
    
    throw new Error("Tool not found");
  });

  app.listen(PORT, () => {
    console.log(`[Eidos] MCP Server running on port ${PORT}`);
    console.log(`[Eidos] SSE endpoint available at http://localhost:${PORT}/sse`);
  });
}

main().catch(console.error);
