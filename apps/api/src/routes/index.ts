import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health';
import { authRoutes } from './auth';
import { profileRoutes } from './profile';
import { trainingPlanRoutes } from './training-plans';

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  // Health checks
  await fastify.register(healthRoutes);

  // Auth & Profile
  await fastify.register(authRoutes);
  await fastify.register(profileRoutes, { prefix: '/me/profile' });

  // Training Plans
  await fastify.register(trainingPlanRoutes, { prefix: '/me/training-plans' });
}
