import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { processImage } from "../../../utils/image";
import { Context } from "hono";


export const grayscaleRoute = {
  route: createRoute({
    method: "post",
    path: "/grayscale",
    tags: ["Image Processing"],
    summary: "Convert image to grayscale",
    description: "Upload an image to convert it to grayscale",
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              image: z
                .any()
                .describe("Image file to convert")
                .openapi({
                  type: "string",
                  format: "binary",
                }),
              format: z.string().optional().default("jpeg").describe(
                "Output format (jpeg/png)",
              ),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Grayscale image",
        content: {
          "image/jpeg": {
            schema: z.string().openapi({ type: "string", format: "binary" }),
          },
          "image/png": {
            schema: z.string().openapi({ type: "string", format: "binary" }),
          },
        },
      },
      400: {
        description: "Bad request - no image provided",
      },
    },
  }),
  handler: async (c: Context) => {
    const formData = await c.req.formData();
    const file = formData.get("image");
    const format = formData.get("format") as string || "jpeg";

    if (!(file instanceof File)) {
      return c.text("Image is required", 400);
    }

    try {
      const buffer = await file.arrayBuffer();
      const processed = await processImage({
        buffer,
        format: format as "jpeg" | "png",
        transformations: [(img) => img.grayscale()],
      });

      return new Response(processed, {
        headers: {
          "Content-Type": `image/${format}`,
        },
      });
    } catch (error) {
      console.error("Grayscale conversion error:", error);
      return c.text("Error processing image", 500);
    }
  },
};
