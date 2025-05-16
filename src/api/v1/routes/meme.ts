import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import sharp from 'sharp';
import { Buffer } from "node:buffer";
import { Context } from 'hono';

export const memeRoute = {
  route: createRoute({
    method: 'post',
    path: '/meme',
    tags: ['Image Generation'],
    summary: 'Create a meme',
    description: 'Generate a meme with custom text on an image',
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              image: z
                .any()
                .optional()
                .describe('Base image file (optional, uses default if not provided)')
                .openapi({
                  type: 'string',
                  format: 'binary',
                }),
              topText: z.string().optional().describe('Top meme text'),
              bottomText: z.string().optional().describe('Bottom meme text'),
              textColor: z.string().optional().default('#ffffff').describe('Text color'),
              fontSize: z.string().optional().default('48').describe('Font size in pixels'),
              format: z.string().optional().default('jpeg').describe('Output format (jpeg/png)'),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Generated meme image',
        content: {
          'image/jpeg': {
            schema: z.string().openapi({ type: 'string', format: 'binary' }),
          },
          'image/png': {
            schema: z.string().openapi({ type: 'string', format: 'binary' }),
          },
        },
      },
    },
  }),
  handler: async (c: Context) => {
    const formData = await c.req.formData();
    const file = formData.get('image');
    const topText = formData.get('topText') as string || '';
    const bottomText = formData.get('bottomText') as string || '';
    const textColor = formData.get('textColor') as string || '#ffffff';
    const fontSize = parseInt(formData.get('fontSize') as string || '48');
    const format = formData.get('format') as string || 'jpeg';

    try {
      // Use default meme template if no image provided
      let imageBuffer: Buffer;
      if (file instanceof File) {
        imageBuffer = Buffer.from(await file.arrayBuffer());
      } else {
        // Default meme template (white 800x600 image)
        imageBuffer = await sharp({
          create: {
            width: 800,
            height: 600,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
          }
        }).jpeg().toBuffer();
      }

      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      const width = metadata.width || 800;
      const height = metadata.height || 600;

      // Create SVG for text overlay
      const svgText = Buffer.from(`
        <svg width="${width}" height="${height}">
          <style>
            .meme-text {
              font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
              font-weight: bold;
              fill: ${textColor};
              stroke: #000000;
              stroke-width: ${fontSize / 12};
              paint-order: stroke fill;
              text-transform: uppercase;
            }
          </style>
          ${topText ? `
            <text 
              x="50%" 
              y="${fontSize + 20}" 
              font-size="${fontSize}" 
              text-anchor="middle" 
              class="meme-text"
            >
              ${topText}
            </text>
          ` : ''}
          ${bottomText ? `
            <text 
              x="50%" 
              y="${height - 20}" 
              font-size="${fontSize}" 
              text-anchor="middle" 
              class="meme-text"
            >
              ${bottomText}
            </text>
          ` : ''}
        </svg>
      `);

      const meme = await image
        .composite([{ input: svgText, blend: 'over' }])
        .toFormat(format as 'jpeg' | 'png')
        .toBuffer();

      return new Response(meme, {
        headers: {
          'Content-Type': `image/${format}`,
        },
      });
    } catch (error) {
      console.error('Meme generation error:', error);
      return c.text('Error generating meme', 500);
    }
  }
};