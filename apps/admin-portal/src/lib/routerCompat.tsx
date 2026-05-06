import React from "react";
import {
  Link as TanStackLink,
  Navigate as TanStackNavigate,
  Outlet as TanStackOutlet,
  useLocation as useTanStackLocation,
  useNavigate as useTanStackNavigate,
  useParams as useTanStackParams,
  useRouterState,
  useSearch as useTanStackSearch,
} from "@tanstack/react-router";

export const Outlet = TanStackOutlet;
export const Navigate = TanStackNavigate;
export function Link(props: React.ComponentProps<typeof TanStackLink>) {
  return <TanStackLink {...(props as any)} />;
}

export function useNavigate() {
  const navigate = useTanStackNavigate();
  return (to: string) => {
    const url = new URL(to, window.location.origin);
    const search: Record<string, string> = {};

    url.searchParams.forEach((value, key) => {
      search[key] = value;
    });

    return navigate({
      to: url.pathname,
      search,
    } as any);
  };
}

export function useLocation() {
  return useTanStackLocation();
}

export function useParams<TParams extends Record<string, string | undefined>>() {
  return useTanStackParams({ strict: false } as any) as TParams;
}

export function useSearchParams(): [
  URLSearchParams,
  (updater: (prev: URLSearchParams) => URLSearchParams) => void,
] {
  const search = useTanStackSearch({ strict: false } as any) as Record<string, unknown>;
  const navigate = useTanStackNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const params = React.useMemo(() => {
    const next = new URLSearchParams();

    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) {
        next.set(key, String(value));
      }
    }

    return next;
  }, [search]);

  const setSearchParams = React.useCallback(
    (updater: (prev: URLSearchParams) => URLSearchParams) => {
      const nextParams = updater(new URLSearchParams(params.toString()));
      const nextSearch: Record<string, string> = {};

      nextParams.forEach((value, key) => {
        nextSearch[key] = value;
      });

      void navigate({
        to: pathname,
        search: nextSearch,
        replace: true,
      } as any);
    },
    [navigate, params, pathname],
  );

  return [params, setSearchParams];
}
