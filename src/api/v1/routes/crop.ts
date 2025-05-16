// deno-lint-ignore-file no-explicit-any
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { processImage } from '../../../utils/image.ts';

export const cropRoute = {
  route: createRoute({
    method: 'post',
    path: '/crop',
    tags: ['Image Transformation'],
    summary: 'Crop an image',
    description: 'Upload an image to crop it to specified dimensions',
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              image: z
                .any()
                .describe('Image file to crop')
                .openapi({
                  type: 'string',
                  format: 'binary',
                }),
              left: z.string().describe('Left position to start crop'),
              top: z.string().describe('Top position to start crop'),
              width: z.string().describe('Width of crop area'),
              height: z.string().describe('Height of crop area'),
              format: z.string().optional().default('jpeg').describe('Output format (jpeg/png)'),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Cropped image',
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
    const left = parseInt(formData.get('left') as string);
    const top = parseInt(formData.get('top') as string);
    const width = parseInt(formData.get('width') as string);
    const height = parseInt(formData.get('height') as string);
    const format = formData.get('format') as string || 'jpeg';
    
    if (!(file instanceof File) || isNaN(left) || isNaN(top) || isNaN(width) || isNaN(height)) {
      return c.text('Image and all crop parameters are required', 400);
    }

    try {
      const buffer = await file.arrayBuffer();
      const processed = await processImage({
        buffer,
        format: format as 'jpeg' | 'png',
        transformations: [(img) => img.extract({ left, top, width, height })],
      });

      return new Response(processed, {
        headers: {
          'Content-Type': `image/${format}`,
          'X-Crop-Dimensions': `${width}x${height} from (${left},${top})`,
        },
      });
    } catch (error) {
      console.error('Crop error:', error);
      return c.text('Error processing image', 500);
    }
  }
};