import { createRoute } from '@tanstack/react-router';
import { rmRoute } from './rm';
import { FollowUps } from '../features/rm/FollowUps';

export const followUpsRoute = createRoute({
  getParentRoute: () => rmRoute,
  path: 'follow-ups',
  component: FollowUps,
});
