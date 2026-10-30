import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import app from './app.js';
import { config } from './config/env.js';
import checkConnectionDB from './models/DBConnection.js';

async function startServer() {
  await checkConnectionDB();
  await new Promise((resolve, reject) => {
    const server = app.listen(config.port, '0.0.0.0', resolve);
    server.once('error', reject);
  });
  console.log(`API listening on port ${config.port}.`);
}

startServer().catch((error) => {
  console.error('Could not connect to MongoDB or start the API.', error);
  process.exitCode = 1;
});
