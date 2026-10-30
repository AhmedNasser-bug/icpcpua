import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

import mongoose from 'mongoose';
import app from '../src/app.js';
import { config } from '../src/config/env.js';

let connectionPromise;

async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(config.mongoUri)
        .catch((error) => {
            connectionPromise = null;
            throw error;
        });
    }

    await connectionPromise;
}

export default async function handler(req, res) {
    try {
        await connectDB();
        return app(req, res);
    } catch (error) {
        console.error('Backend initialization failed:', error.message);
        return res.status(500).json({
        message: 'Internal Server Error'
        });
    }
}