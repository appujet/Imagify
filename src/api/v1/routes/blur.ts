// deno-lint-ignore-file
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import sharp from 'sharp';
import { Buffer } from "node:buffer";

export const blurRoute = {
  route: createRoute({
    method: 'post',
    path: '/blur',
    tags: ['Image Processing'],
    summary: 'Blur an image',
    description: 'Upload an image to apply blur effect with customizable intensity',
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              image: z
                .any()
                .describe('Image file to blur')
                .openapi({
                  type: 'string',
                  format: 'binary',
                }),
              sigma: z.string().optional().default('5').describe('Blur intensity (0.3-1000)'),
              format: z.string().optional().default('jpeg').describe('Output format (jpeg/png)'),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Blurred image',
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
    const sigma = parseFloat((formData.get('sigma') || '5') as string);
    const format = formData.get('format') as string || 'jpeg';
    
    if (!(file instanceof File)) {
      return c.text('Image is required', 400);
    }

    // Validate sigma value
    if (sigma < 0.3 || sigma > 1000) {
      return c.text('Sigma must be between 0.3 and 1000', 400);
    }

    const buffer = await file.arrayBuffer();
    const sharpInstance = sharp(Buffer.from(buffer)).blur(sigma);

    const outputBuffer = format === 'png' 
      ? await sharpInstance.png().toBuffer()
      : await sharpInstance.jpeg().toBuffer();

    return new Response(outputBuffer, {
      headers: {
        'Content-Type': `image/${format}`,
        'X-Image-Processing': `blurred with sigma=${sigma}`,
      },
    });
  }
};