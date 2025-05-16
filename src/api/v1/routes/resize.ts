// deno-lint-ignore-file no-explicit-any
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { processImage } from '../../../utils/image.ts';
import { FitEnum } from "sharp";

export const resizeRoute = {
  route: createRoute({
    method: 'post',
    path: '/resize',
    tags: ['Image Transformation'],
    summary: 'Resize an image',
    description: 'Upload an image to resize it with various options',
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              image: z
                .any()
                .describe('Image file to resize')
                .openapi({
                  type: 'string',
                  format: 'binary',
                }),
              width: z.string().describe('New width in pixels'),
              height: z.string().describe('New height in pixels'),
              fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside'])
                .optional()
                .default('cover')
                .describe('How to fit the image to the dimensions'),
              format: z.string().optional().default('jpeg').describe('Output format (jpeg/png)'),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Resized image',
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
        description: 'Bad request - invalid parameters',
      },
    },
  }),
  handler: async (c: any) => {
    const formData = await c.req.formData();
    const file = formData.get('image');
    const width = parseInt(formData.get('width') as string);
    const height = parseInt(formData.get('height') as string);
    const fit = formData.get('fit') as string || 'cover';
    const format = formData.get('format') as string || 'jpeg';
    
    if (!(file instanceof File) || isNaN(width) || isNaN(height)) {
      return c.text('Image, width and height are required', 400);
    }

    try {
      const buffer = await file.arrayBuffer();
      const processed = await processImage({
        buffer,
        format: format as 'jpeg' | 'png',
        transformations: [(img) => img.resize(width, height, { fit: fit as keyof FitEnum })],
      });

      return new Response(processed, {
        headers: {
          'Content-Type': `image/${format}`,
          'X-Image-Dimensions': `${width}x${height}`,
        },
      });
    } catch (error) {
      console.error('Resize error:', error);
      return c.text('Error processing image', 500);
    }
  }
};