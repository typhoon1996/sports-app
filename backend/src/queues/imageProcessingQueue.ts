import { Queue } from 'bullmq';
import redisConnection from '../config/redis';
import logger from '../config/logger';

const imageProcessingQueue = new Queue('imageProcessing', {
  connection: redisConnection,
});

imageProcessingQueue.on('completed', (job) => {
  logger.info(`Job completed: ${job.id}`);
});

imageProcessingQueue.on('failed', (job, err) => {
  logger.error(`Job failed: ${job.id}, error: ${err.message}`);
});

imageProcessingQueue.on('error', (err) => {
  logger.error(`Queue error: ${err.message}`);
});

export default imageProcessingQueue;