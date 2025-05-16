import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import QRCode from "qrcode";
import sharp from "sharp";
import { Context } from "hono";

export const qrcodeRoute = {
  route: createRoute({
    method: "get",
    path: "/qrcode",
    tags: ["Image Generation"],
    summary: "Generate QR code",
    description: "Generate a QR code image from text or URL",
    request: {
      query: z.object({
        text: z.string().describe("Text or URL to encode in QR code"),
        size: z.string().optional().default("300").describe("Size in pixels"),
        margin: z.string().optional().default("1").describe("Margin size"),
        color: z.string().optional().default("#000000").describe(
          "QR code color",
        ),
        bgcolor: z.string().optional().default("#FFFFFF").describe(
          "Background color",
        ),
        format: z.enum(["png", "jpeg", "svg"]).optional().default("png"),
      }),
    },
    responses: {
      200: {
        description: "QR code image",
        content: {
          "image/png": { schema: z.any() },
          "image/jpeg": { schema: z.any() },
          "image/svg+xml": { schema: z.any() },
        },
      },
    },
  }),
  handler: async (c: Context) => {
    const { text, size, margin, color, bgcolor, format } = c.req.query();

    try {
      // Validate URL if the text looks like one
      let qrContent = text;
      try {
        if (text.match(/^https?:\/\//i)) {
          new URL(text); // This will throw if not a valid URL
        }
      } catch (e) {
        return c.text("Invalid URL provided", 400);
      }

      const sizeNum = parseInt(size);
      const marginNum = parseInt(margin);

      if (format === "svg") {
        const svg = await QRCode.toString(qrContent, {
          type: "svg",
          width: sizeNum,
          margin: marginNum,
          color: {
            dark: color,
            light: bgcolor,
          },
        });
        return new Response(svg, {
          headers: { "Content-Type": "image/svg+xml" },
        });
      } else {
        const qrBuffer = await QRCode.toBuffer(qrContent, {
          width: sizeNum,
          margin: marginNum,
          color: {
            dark: color,
            light: bgcolor,
          },
        });

        let image = sharp(qrBuffer);
        if (format === "jpeg") {
          image = image.jpeg();
        } else {
          image = image.png();
        }

        const buffer = await image.toBuffer();
        return new Response(buffer, {
          headers: { "Content-Type": `image/${format}` },
        });
      }
    } catch (error) {
      console.error("QR Code error:", error);
      return c.text("Error generating QR code", 500);
    }
  },
};
