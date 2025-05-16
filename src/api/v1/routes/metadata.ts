import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import sharp from "sharp";
import { Buffer } from "node:buffer";

export const metadataRoute = {
  route: createRoute({
    method: "post",
    path: "/metadata",
    tags: ["Image Analysis"],
    summary: "Extract image metadata",
    description: "Upload an image to extract its metadata",
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              image: z
                .any()
                .describe("Image file to analyze")
                .openapi({
                  type: "string",
                  format: "binary",
                }),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Image metadata",
        content: {
          "application/json": {
            schema: z.object({
              format: z.string(),
              width: z.number(),
              height: z.number(),
              space: z.string(),
              channels: z.number(),
              depth: z.string(),
              density: z.number().optional(),
              isProgressive: z.boolean().optional(),
              hasProfile: z.boolean().optional(),
              hasAlpha: z.boolean().optional(),
              orientation: z.number().optional(),
              exif: z.record(z.any()).optional(),
              icc: z.string().optional(),
              iptc: z.record(z.any()).optional(),
              xmp: z.record(z.any()).optional(),
              tifftag: z.record(z.any()).optional(),
            }),
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

    if (!(file instanceof File)) {
      return c.text("Image is required", 400);
    }

    try {
      const buffer = await file.arrayBuffer();
      const metadata = await sharp(Buffer.from(buffer)).metadata();

      return c.json({
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        space: metadata.space,
        channels: metadata.channels,
        depth: metadata.depth,
        density: metadata.density,
        isProgressive: metadata.isProgressive,
        hasProfile: metadata.hasProfile,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation,
        exif: metadata.exif,
        icc: metadata.icc,
        iptc: metadata.iptc,
        xmp: metadata.xmp,
      });
    } catch (error) {
      console.error("Metadata extraction error:", error);
      return c.text("Error extracting metadata", 500);
    }
  },
};
