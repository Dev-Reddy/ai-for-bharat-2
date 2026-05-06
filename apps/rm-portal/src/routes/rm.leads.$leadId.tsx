import { createRoute } from '@tanstack/react-router';
import { rmRoute } from './rm';
import { LeadDetail } from '../features/rm/LeadDetail';

export const leadDetailRoute = createRoute({
  getParentRoute: () => rmRoute,
  path: 'leads/$leadId',
  component: LeadDetail,
});
