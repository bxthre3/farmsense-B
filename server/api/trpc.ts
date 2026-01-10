import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { db } from '../db/index.js';
import { z } from 'zod';

/**
 * Context for tRPC procedures
 */
export const createContext = ({ req, res }: CreateExpressContextOptions) => {
  return {
    req,
    res,
    db,
  };
};

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Reusable middleware that checks if a user is authenticated
 */
const isAuthed = t.middleware(({ next, ctx }) => {
  // In a real app, check for session/token here
  // For demo, we'll assume authenticated
  return next({
    ctx: {
      ...ctx,
      user: { id: 'demo-user-id' },
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
