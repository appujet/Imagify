import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { routes } from "./routes/index";
import { logger } from "hono/logger";


export const app = new OpenAPIHono();

app.use("*", logger());
// API versioning

const v1 = new OpenAPIHono();
v1.route("/", routes);

// Documentation
app.get(
  "/",
  swaggerUI({
    url: "/api/v1/doc",
  }),
);

app.doc("/api/v1/doc", {
  info: {
    title: "Image Processing API",
    description: "API for image processing operations with sharp",
    contact: {
      name: "Image Processing API",
      email: "me@appujet.site",
    },
    version: "v1",
  },
  openapi: "3.1.0",
});

// Mount the versioned app
app.route("/api/v1", v1);
