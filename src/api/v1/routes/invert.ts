import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import sharp from "sharp";
import { Buffer } from "node:buffer";
import { Context } from "hono";

export const invertRoute = {
  route: createRoute({
    method: "post",
    path: "/invert",
    tags: ["Image Processing"],
    summary: "Invert an image",
    description: "Upload an image to invert its colors",
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              image: z
                .any()
                .describe("Image file to invert")
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
        description: "Inverted image",
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

    const buffer = await file.arrayBuffer();
    const sharpInstance = sharp(Buffer.from(buffer)).negate({ alpha: true });

    const outputBuffer = format === "png"
      ? await sharpInstance.png().toBuffer()
      : await sharpInstance.jpeg().toBuffer();

    return new Response(outputBuffer, {
      headers: {
        "Content-Type": `image/${format}`,
      },
    });
  },
};
