import { OpenAPIHono } from "@hono/zod-openapi";
import { SwaggerUI, swaggerUI } from "@hono/swagger-ui";
import { routes } from "./routes/index";
import { logger } from "hono/logger";

export const app = new OpenAPIHono();

app.use("*", logger());

// API versioning
const v1 = new OpenAPIHono();
v1.route("/", routes);

// Documentation
/* app.get(
  "/",
  swaggerUI({
    url: "/api/v1/doc",
    title: "Imagify API",
  }),
); */

app.get("/", (c) => {
  return c.html(`
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Imagify - Powerful Image Processing API with sharp" />
        <title>Imagify</title>
        <style>
        /* Fast dark mode https://github.com/swagger-api/swagger-ui/issues/5327 */
@media (prefers-color-scheme: dark) {
    body {
        background: black;
    }
    .swagger-ui {
        filter: invert(88%) hue-rotate(180deg);
    }
    .swagger-ui .microlight {
        filter: invert(100%) hue-rotate(180deg);
    }
}
    </style>
          /* custom style */
        </style>
        <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui@5.10.0/dist/swagger-ui-bundle.js" integrity="sha256-i050FsZ0MSwm3mVMv7IhpfCdK90RKaXPS/EmiWxv8vc=" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui@5.10.0/dist/swagger-ui-standalone-preset.js" integrity="sha256-IGoJVXW7MRyeZOsKceWVePAShfVpJhnYhDhOQp+Yi38=" crossorigin="anonymous"></script>    
    <script>
        // Initialize Swagger UI
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: "openapi.yaml",
                dom_id: '#swagger-ui',           
            });
            window.ui = ui;
        };
      </script>
      </body>
      </head>
      ${SwaggerUI({ url: "/api/v1/doc" })}
    </html>
  `);
});
app.doc("/api/v1/doc", {
  info: {
    title: "Imagify API",
    description: "Imagify - Powerful Image Processing API with sharp",
    contact: {
      name: "Imagify API Support",
      email: "me@appujet.site",
    },
    license: {
      name: "MIT",
    },
    version: "v1",
  },
  openapi: "3.1.0",
  externalDocs: {
    description: "GitHub Repository",
    url: "https://github.com/appujet/imagify", // Add your GitHub repo URL here
  },
});

// Mount the versioned app
app.route("/api/v1", v1);
