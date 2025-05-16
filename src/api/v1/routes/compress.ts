// deno-lint-ignore-file
// Updated src/api/v1/routes/compress.ts
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { processImage } from '../../../utils/image.ts';

export const compressRoute = {
  route: createRoute({
    method: 'post',
    path: '/compress',
    tags: ['Image Processing'],
    summary: 'Compress an image',
    description: 'Upload an image to compress it with optional quality adjustment',
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              image: z
                .any()
                .describe('Image file to compress')
                .openapi({
                  type: 'string',
                  format: 'binary',
                }),
              quality: z.string().optional().default('70').describe('Compression quality (1-100)'),
              format: z.string().optional().default('jpeg').describe('Output format (jpeg/png)'),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Compressed image',
        content: {
          'image/jpeg': {
            schema: z.string().openapi({ type: 'string', format: 'binary' }),
          },
          'image/png': {
            schema: z.string().openapi({ type: 'string', format: 'binary' }),
          },
        },
      },
      400: {
        description: 'Bad request - no image provided or invalid parameters',
      },
    },
  }),
  handler: async (c: any) => {
    const formData = await c.req.formData();
    const file = formData.get('image');
    const quality = parseInt((formData.get('quality') || '70') as string);
    const format = formData.get('format') as string || 'jpeg';
    
    if (!(file instanceof File)) {
      return c.text('Image is required', 400);
    }

    if (quality < 1 || quality > 100) {
      return c.text('Quality must be between 1 and 100', 400);
    }

    try {
      const buffer = await file.arrayBuffer();
      const compressed = await processImage({
        buffer,
        format: format as 'jpeg' | 'png',
        quality,
      });

      return new Response(compressed, {
        headers: {
          'Content-Type': `image/${format}`,
          'X-Image-Quality': quality.toString(),
        },
      });
    } catch (error) {
      console.error('Compression error:', error);
      return c.text('Error processing image', 500);
    }
  }
};