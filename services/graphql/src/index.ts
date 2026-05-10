import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import fs from 'fs';

const PORT = process.env.PORT || 4000;

// Retry logic to wait for Postgres to be ready
async function waitForDb(pool: Pool) {
  console.log(`[GraphQL] Waiting for database connection to be ready...`);
  
  while (true) {
    try {
      await pool.query('SELECT 1');
      console.log(`[GraphQL] Database connection established.`);
      return;
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Define GraphQL schema
const typeDefs = `#graphql
  scalar JSON

  type Event {
    id: ID!
    timestamp: String!
    domain: String!
    type: String!
    data: JSON!
  }

  type Query {
    events(domain: String, type: String, limit: Int = 50): [Event!]!
    event(id: ID!): Event
  }

  type Mutation {
    insertEvent(id: ID!, domain: String!, type: String!, data: JSON!): Event!
  }
`;

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
  
  await waitForDb(pool);

  const resolvers = {
    Query: {
      events: async (_: any, args: { domain?: string, type?: string, limit: number }) => {
        let query = 'SELECT * FROM events WHERE 1=1';
        const params: any[] = [];
        let paramCount = 1;
        
        if (args.domain) {
          query += ` AND domain = $${paramCount++}`;
          params.push(args.domain);
        }
        if (args.type) {
          query += ` AND type = $${paramCount++}`;
          params.push(args.type);
        }
        
        query += ` ORDER BY timestamp DESC LIMIT $${paramCount++}`;
        params.push(args.limit);
        
        const result = await pool.query(query, params);
        // Postgres pg library automatically parses JSONB columns into JS objects!
        return result.rows;
      },
      event: async (_: any, args: { id: string }) => {
        const result = await pool.query('SELECT * FROM events WHERE id = $1', [args.id]);
        if (result.rows.length === 0) return null;
        return result.rows[0];
      }
    },
    Mutation: {
      insertEvent: async (_: any, args: { id: string, domain: string, type: string, data: any }) => {
        await pool.query(
          'INSERT INTO events (id, domain, type, data) VALUES ($1, $2, $3, $4)',
          [args.id, args.domain, args.type, args.data]
        );
        return {
          id: args.id,
          timestamp: new Date().toISOString(),
          domain: args.domain,
          type: args.type,
          data: args.data
        };
      }
    }
  };

  const app = express();
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server)
  );

  app.listen(PORT, () => {
    console.log(`[GraphQL] Server running on port ${PORT}`);
    console.log(`[GraphQL] Endpoint available at http://localhost:${PORT}/graphql`);
  });
}

main().catch(console.error);
