import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { registerRoutes } from './routes/register';
import dotenv from 'dotenv';

dotenv.config();

const app = Fastify({ logger: true });
app.register(cors, { origin: true });

export const prisma = new PrismaClient();

app.get('/api/health', async () => ({ ok: true }));

registerRoutes(app);

const port = Number(process.env.PORT || 3001);
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`Server listening on http://localhost:${port}`);
}).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
