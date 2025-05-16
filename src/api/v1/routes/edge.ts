import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { processImage } from "../../../utils/image";
import { Context } from "hono";


export const edgeRoute = {
  route: createRoute({
    method: "post",
    path: "/edge",
    tags: ["Image Effects"],
    summary: "Detect edges in an image",
    description: "Upload an image to apply edge detection",
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              image: z
                .any()
                .describe("Image file for edge detection")
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
        description: "Image with edge detection applied",
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
  // deno-lint-ignore no-explicit-any
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
        transformations: [
          (img) => img.greyscale(),
          (img) => img.normalise(),
          (img) =>
            img.convolve({
              width: 3,
              height: 3,
              kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
            }),
        ],
      });

      return new Response(processed, {
        headers: {
          "Content-Type": `image/${format}`,
        },
      });
    } catch (error) {
      console.error("Edge detection error:", error);
      return c.text("Error processing image", 500);
    }
  },
};
