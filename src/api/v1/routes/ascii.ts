import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import sharp from 'sharp';
import { Context } from 'hono';

export const asciiRoute = {
  route: createRoute({
    method: 'post',
    path: '/ascii',
    tags: ['Image Conversion'],
    summary: 'Convert image to ASCII art',
    description: 'Transform an image into ASCII character art',
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              image: z
                .any()
                .describe('Image file to convert')
                .openapi({
                  type: 'string',
                  format: 'binary',
                }),
              width: z.string().optional().default('100').describe('Output width in characters'),
              chars: z.string().optional().default('@%#*+=-:. ').describe('Characters to use for brightness levels'),
              inverted: z.string().optional().default('false').describe('Invert brightness'),
              format: z.enum(['text', 'html', 'json']).optional().default('text').describe('Output format'),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'ASCII art representation',
        content: {
          'text/plain': {
            schema: z.string(),
          },
          'text/html': {
            schema: z.string(),
          },
          'application/json': {
            schema: z.object({
              ascii: z.string(),
              width: z.number(),
              height: z.number(),
            }),
          },
        },
      },
    },
  }),
  handler: async (c: Context) => {
    const formData = await c.req.formData();
    const file = formData.get('image');
    const width = parseInt((formData.get('width') || '100') as string, 10);
    const chars = formData.get('chars') as string || '@%#*+=-:. ';
    const inverted = formData.get('inverted') as string === 'true';
    const format = formData.get('format') as string || 'text';

    if (!(file instanceof File)) {
      return c.text('Image is required', 400);
    }

    try {
      const buffer = await file.arrayBuffer();
      const image = sharp(Buffer.from(buffer))
        .grayscale()
        .resize(width, Math.floor(width / 2)); // Maintain aspect ratio

      const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
      
      // Generate ASCII art
      let ascii = '';
      const charSet = inverted ? chars.split('').reverse().join('') : chars;
      
      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
          const idx = (y * info.width + x) * info.channels;
          const brightness = data[idx] / 255; // 0-1
          const charIdx = Math.floor(brightness * (charSet.length - 1));
          ascii += charSet[charIdx];
        }
        ascii += '\n';
      }

      // Format response
      switch (format) {
        case 'html':
          return c.html(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>ASCII Art</title>
                <style>
                  body { background: #222; color: #eee; }
                  pre { font-family: monospace; line-height: 1; }
                </style>
              </head>
              <body>
                <pre>${ascii}</pre>
              </body>
            </html>
          `);
        case 'json':
          return c.json({
            ascii,
            width: info.width,
            height: info.height
          });
        case 'text':
        default:
          return new Response(ascii, {
            headers: { 'Content-Type': 'text/plain' }
          });
      }
    } catch (error) {
      console.error('ASCII conversion error:', error);
      return c.text('Error generating ASCII art', 500);
    }
  }
};