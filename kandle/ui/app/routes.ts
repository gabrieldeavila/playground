import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("pages/home/index.tsx"),
  route("watchlist", "pages/watchlist/index.tsx"),
  route("opportunities", "pages/opportunities/index.tsx"),
  route("discover", "pages/discover/index.tsx"),
] satisfies RouteConfig;
