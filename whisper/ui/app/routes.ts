import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("pages/home/index.tsx"),
  route("recordings/:id", "pages/recordings/$id.tsx"),
  route("recordings/new", "pages/recordings/new.tsx"),
] satisfies RouteConfig;
