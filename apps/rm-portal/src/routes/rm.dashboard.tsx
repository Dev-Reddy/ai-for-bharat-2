
import { createRoute } from '@tanstack/react-router';
import { rmRoute } from './rm';
import { RMDashboard } from '../features/rm/Dashboard';

export const dashboardRoute = createRoute({
  getParentRoute: () => rmRoute,
  path: 'dashboard',
  component: RMDashboard, 
});
