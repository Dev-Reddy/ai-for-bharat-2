import { createRoute, useNavigate } from '@tanstack/react-router';
import { rmRoute } from './rm';
import { HotLeads } from '../features/rm/HotLeads';

export const hotLeadsRoute = createRoute({
  getParentRoute: () => rmRoute,
  path: 'hot-leads',
  component: () => {
    const navigate = useNavigate();
    return <HotLeads onSelectLead={(id) => navigate({ to: '/rm/leads/$leadId', params: { leadId: id } })} />;
  },
});
