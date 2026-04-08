import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react";
import { useNavigate, useLocation, type NavigateOptions } from "react-router-dom";

// All routes that have an /embed/* equivalent
const EMBED_ROUTES = new Set([
  "/dashboard",
  "/dashboard/metricas",
  "/agenda",
  "/simulado-filtros",
  "/simulado",
]);

// Map normal routes to their embed counterparts
const toEmbedPath = (path: string): string | null => {
  // Already an embed path
  if (path.startsWith("/embed/")) return path;

  // Separate pathname from search and hash
  const url = new URL(path, "http://_");
  const pathname = url.pathname;
  const suffix = url.search + url.hash;

  // Direct match
  if (EMBED_ROUTES.has(pathname)) return `/embed${pathname}${suffix}`;

  // Check if it starts with a known embed route (for sub-paths like /dashboard/estudo-manual)
  for (const route of EMBED_ROUTES) {
    if (pathname.startsWith(route + "/")) {
      return `/embed${pathname}${suffix}`;
    }
  }

  return null;
};

interface EmbedContextValue {
  isEmbed: boolean;
}

const EmbedContext = createContext<EmbedContextValue>({ isEmbed: false });

export const EmbedProvider = ({ children }: { children: ReactNode }) => {
  const value = useMemo(() => ({ isEmbed: true }), []);
  return <EmbedContext.Provider value={value}>{children}</EmbedContext.Provider>;
};

export const useIsEmbed = () => useContext(EmbedContext).isEmbed;

/**
 * Drop-in replacement for useNavigate that keeps navigation inside /embed/* context.
 * In embed mode:
 *   - If a matching embed route exists → navigates to /embed/...
 *   - If no match → stays on current page (no-op)
 * Outside embed mode: behaves exactly like useNavigate.
 */
export const useEmbedNavigate = () => {
  const navigate = useNavigate();
  const { isEmbed } = useContext(EmbedContext);
  const location = useLocation();

  return useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        navigate(to);
        return;
      }

      if (!isEmbed) {
        navigate(to, options);
        return;
      }

      const embedPath = toEmbedPath(to);
      if (embedPath) {
        navigate(embedPath, options);
      }
      // No matching embed route → stay on current page (no-op)
    },
    [navigate, isEmbed, location.pathname]
  );
};
