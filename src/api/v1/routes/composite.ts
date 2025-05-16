import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import sharp from "sharp";
import { Buffer } from "node:buffer";
import { Context } from "hono";

export const compositeRoute = {
  route: createRoute({
    method: "post",
    path: "/composite",
    tags: ["Image Effects"],
    summary: "Composite images (watermark)",
    description: "Upload a base image and overlay image to create a composite",
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              baseImage: z
                .any()
                .describe("Base image file")
                .openapi({
                  type: "string",
                  format: "binary",
                }),
              overlayImage: z
                .any()
                .describe("Overlay image file")
                .openapi({
                  type: "string",
                  format: "binary",
                }),
              top: z.string().optional().default("0").describe(
                "Top position of overlay",
              ),
              left: z.string().optional().default("0").describe(
                "Left position of overlay",
              ),
              opacity: z.string().optional().default("1").describe(
                "Overlay opacity (0-1)",
              ),
              resizeOverlay: z.string().optional()
                .describe('Resize overlay to width (e.g., "200" or "50%")'),
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
        description: "Composite image",
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
  // deno-lint-ignore no-explicit-any
  handler: async (c: Context) => {
    const formData = await c.req.formData();
    const baseFile = formData.get("baseImage");
    const overlayFile = formData.get("overlayImage");
    const top = parseInt(formData.get("top") as string || "0");
    const left = parseInt(formData.get("left") as string || "0");
    const opacity = parseFloat(formData.get("opacity") as string || "1");
    const resizeOverlay = formData.get("resizeOverlay") as string | null;
    const format = formData.get("format") as string || "jpeg";

    if (!(baseFile instanceof File) || !(overlayFile instanceof File)) {
      return c.text("Both base and overlay images are required", 400);
    }

    try {
      const [baseBuffer, overlayBuffer] = await Promise.all([
        baseFile.arrayBuffer(),
        overlayFile.arrayBuffer(),
      ]);

      // Get base image dimensions
      const baseImage = sharp(Buffer.from(baseBuffer));
      const baseMetadata = await baseImage.metadata();
      const baseWidth = baseMetadata.width || 0;
      const baseHeight = baseMetadata.height || 0;

      // Process overlay image
      let overlayImage = sharp(Buffer.from(overlayBuffer));

      // Resize overlay if requested
      if (resizeOverlay) {
        if (resizeOverlay.endsWith("%")) {
          // Percentage resize
          const percent = parseFloat(resizeOverlay) / 100;
          overlayImage = overlayImage.resize({
            width: Math.floor(baseWidth * percent),
            height: Math.floor(baseHeight * percent),
            fit: "inside",
            withoutEnlargement: true,
          });
        } else {
          // Fixed width resize (maintain aspect ratio)
          overlayImage = overlayImage.resize({
            width: parseInt(resizeOverlay),
            fit: "inside",
            withoutEnlargement: true,
          });
        }
      }

      // Apply opacity if needed
      if (opacity < 1) {
        overlayImage = overlayImage.composite([{
          input: Buffer.from([0, 0, 0, 255 * (1 - opacity)]),
          raw: {
            width: 1,
            height: 1,
            channels: 4,
          },
          tile: true,
          blend: "dest-in",
        }]);
      }

      const overlayProcessed = await overlayImage.toBuffer();

      // Create composite
      const composite = await baseImage
        .composite([{
          input: overlayProcessed,
          top: Math.max(0, top),
          left: Math.max(0, left),
          blend: "over",
        }])
        .toFormat(format as "jpeg" | "png")
        .toBuffer();

      return new Response(composite, {
        headers: {
          "Content-Type": `image/${format}`,
          "X-Composite-Position": `${left},${top}`,
        },
      });
      // deno-lint-ignore no-explicit-any
    } catch (error: any) {
      console.error("Composite error:", error);
      return c.text("Error processing images: " + error.message, 500);
    }
  },
};
