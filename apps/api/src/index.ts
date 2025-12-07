import { createServer } from './server';
import { loadConfig } from './config';

async function start() {
  const config = loadConfig();

  const server = await createServer(config);

  try {
    await server.listen({ port: config.port, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      server.log.info(`Received ${signal}, closing server gracefully...`);
      await server.close();
      process.exit(0);
    });
  });
}

start();
