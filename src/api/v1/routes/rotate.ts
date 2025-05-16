import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { processImage } from "../../../utils/image";
import { Context } from "hono";


export const rotateRoute = {
  route: createRoute({
    method: "post",
    path: "/rotate",
    tags: ["Image Transformation"],
    summary: "Rotate an image",
    description: "Upload an image to rotate it by specified degrees",
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              image: z
                .any()
                .describe("Image file to rotate")
                .openapi({
                  type: "string",
                  format: "binary",
                }),
              angle: z.string().describe("Rotation angle in degrees"),
              background: z.string().optional().describe(
                "Background color for exposed areas",
              ),
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
        description: "Rotated image",
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
        description: "Bad request - invalid parameters",
      },
    },
  }),
  handler: async (c: Context) => {
    const formData = await c.req.formData();
    const file = formData.get("image");
    const angle = parseFloat(formData.get("angle") as string);
    const background = formData.get("background") as string || "#00000000";
    const format = formData.get("format") as string || "jpeg";

    if (!(file instanceof File) || isNaN(angle)) {
      return c.text("Image and rotation angle are required", 400);
    }

    try {
      const buffer = await file.arrayBuffer();
      const processed = await processImage({
        buffer,
        format: format as "jpeg" | "png",
        transformations: [(img) => img.rotate(angle, { background })],
      });

      return new Response(processed, {
        headers: {
          "Content-Type": `image/${format}`,
          "X-Rotation-Angle": angle.toString(),
        },
      });
    } catch (error) {
      console.error("Rotation error:", error);
      return c.text("Error processing image", 500);
    }
  },
};
