import { createRoute } from '@tanstack/react-router';
import { rmRoute } from './rm';
import { MyLeads } from '../features/rm/MyLeads';

export const leadsRoute = createRoute({
  getParentRoute: () => rmRoute,
  path: 'leads',
  component: MyLeads,
});
