import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import sharp from "sharp";
import { Context } from "hono";
import { Buffer } from "node:buffer";
import { parseColor, presetColors } from "../../../utils/color";

export const colorRoute = {
  route: createRoute({
    method: "get",
    path: "/color",
    tags: ["Image Generation"],
    summary: "Generate a solid color image",
    request: {
      query: z.object({
        color: z.string().optional().describe("Color hex/rgb/hsl/rgba"),
        name: z.string().optional().describe("Discord preset name"),
        width: z.string().optional().default("512"),
        height: z.string().optional().default("512"),
        alpha: z.string().optional().describe("Transparency (0-1)"),
        shape: z.enum(["rectangle", "circle"]).optional().default("rectangle"),
        format: z.enum(["png", "jpeg"]).optional().default("png"),
      }),
    },
    responses: {
      200: {
        description: "Generated image",
        content: {
          "image/png": { schema: z.any() },
          "image/jpeg": { schema: z.any() },
        },
      },
      400: {
        description: "Invalid color format or missing parameters",
      },
    },
  }),
  // deno-lint-ignore no-explicit-any
  handler: async (c: Context) => {
    const { color, name, width, height, alpha, shape, format } = c.req.query();
    const finalColor = color || presetColors[name?.toLowerCase() || ""];
    const w = parseInt(width || "512");
    const h = parseInt(height || "512");
    const a = alpha ? parseFloat(alpha) : 1;

    if (!finalColor) return c.text("Missing or invalid color", 400);

    try {
      const [r, g, b] = parseColor(finalColor);

      let image = sharp({
        create: {
          width: w,
          height: h,
          channels: 4,
          background: { r, g, b, alpha: a },
        },
      });

      // Apply shape mask if circle requested
      if (shape === "circle") {
        const circleSvg = `
          <svg width="${w}" height="${h}">
            <circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) / 2}" 
                    fill="rgba(${r},${g},${b},${a})" />
          </svg>
        `;
        image = sharp(Buffer.from(circleSvg));
      }

      // Convert to requested format
      const outputBuffer = format === "jpeg"
        ? await image.jpeg().toBuffer()
        : await image.png().toBuffer();

      return new Response(outputBuffer, {
        headers: {
          "Content-Type": `image/${format}`,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (error) {
      console.error("Color generation error:", error);
      return c.text("Invalid color format or parameters", 400);
    }
  },
};
