import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const invoiceQueue = new Queue('invoice-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Tenta 3 vezes se falhar
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true, // Remove da fila após concluído para não lotar o Redis
    removeOnFail: false,
  },
});
