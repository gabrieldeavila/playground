import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("pages/signals/index.tsx"),
  route("signals", "pages/signals/index.tsx", { id: "signals" }),
  route("signals/:ticker", "pages/ticker/index.tsx"),
] satisfies RouteConfig;
