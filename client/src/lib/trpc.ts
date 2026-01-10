import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../server/api/router.js';

export const trpc = createTRPCReact<AppRouter>();
