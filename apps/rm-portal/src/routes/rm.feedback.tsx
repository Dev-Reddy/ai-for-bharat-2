import { createRoute } from '@tanstack/react-router';
import { rmRoute } from './rm';
import { Feedback } from '../features/rm/Feedback';

export const feedbackRoute = createRoute({
  getParentRoute: () => rmRoute,
  path: 'feedback',
  component: Feedback,
});
