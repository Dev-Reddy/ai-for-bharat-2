import { createRoute } from '@tanstack/react-router';
import { rmRoute } from './rm';

export const notificationsRoute = createRoute({
  getParentRoute: () => rmRoute,
  path: 'notifications',
  component: () => (
    <div className="p-10 bg-white rounded-2xl border border-slate-200 text-slate-400 font-bold italic text-center">
      No new notifications today.
    </div>
  ),
});
