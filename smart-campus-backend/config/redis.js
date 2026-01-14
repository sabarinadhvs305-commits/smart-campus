import { createClient } from 'redis';

// Create the client instance
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));

// Function to connect (call this in server.js)
const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('✅ Redis Connected');
  } catch (error) {
    console.error('❌ Redis Connection Failed:', error);
  }
};

export { redisClient, connectRedis };