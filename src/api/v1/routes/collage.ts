import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import sharp from 'sharp';
import type { Blend } from 'sharp';

import { Buffer } from "node:buffer";
import { Context } from 'hono';

export const collageRoute = {
  route: createRoute({
    method: 'post',
    path: '/collage',
    tags: ['Image Generation'],
    summary: 'Create image collage',
    description: 'Combine multiple images into a collage',
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              images: z
                .any()
                .describe('Image files to combine (upload multiple)')
                .openapi({
                  type: 'string',
                  format: 'binary',
                }),
              layout: z.enum(['grid', 'random', 'circle', 'spiral'])
                .optional()
                .default('grid')
                .describe('Collage layout style'),
              width: z.string().optional().default('1000').describe('Output width'),
              height: z.string().optional().default('800').describe('Output height'),
              spacing: z.string().optional().default('10').describe('Space between images'),
              background: z.string().optional().default('#ffffff').describe('Background color'),
              format: z.string().optional().default('jpeg').describe('Output format (jpeg/png)'),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Generated collage',
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
    const files = formData.getAll('images');
    const layout = formData.get('layout') as string || 'grid';
    const width = parseInt(formData.get('width') as string || '1000');
    const height = parseInt(formData.get('height') as string || '800');
    const spacing = parseInt(formData.get('spacing') as string || '10');
    const background = formData.get('background') as string || '#ffffff';
    const format = formData.get('format') as string || 'jpeg';

    if (files.length === 0 || !(files[0] instanceof File)) {
      return c.text('At least one image is required', 400);
    }

    try {
      // Process all images
      const images = await Promise.all(
        files.filter(f => f instanceof File).map(async (file) => {
          const buffer = await (file as File).arrayBuffer();
          return {
            img: sharp(Buffer.from(buffer)),
            meta: await sharp(Buffer.from(buffer)).metadata()
          };
        })
      );

      // Create base image
      let collage = sharp({
        create: {
          width,
          height,
          channels: 4,
          background
        }
      });

      const composites = [];
      const imageCount = images.length;

      switch (layout) {
        case 'random':
          // Randomly position images
          for (const { img, meta } of images) {
            const maxWidth = Math.min(width / 2, meta.width || width / 3);
            const maxHeight = Math.min(height / 2, meta.height || height / 3);
            const imgWidth = Math.max(50, Math.floor(Math.random() * maxWidth));
            
            const resized = await img
              .resize(imgWidth, null, { fit: 'inside' })
              .toBuffer();
            
            composites.push({
              input: resized,
              top: Math.floor(Math.random() * (height - (maxHeight + spacing))),
              left: Math.floor(Math.random() * (width - (imgWidth + spacing))),
              blend: 'over' as Blend
            });
          }
          break;

        case 'circle':
          // Arrange images in a circle
          const centerX = width / 2;
          const centerY = height / 2;
          const radius = Math.min(width, height) * 0.4;
          
          for (let i = 0; i < images.length; i++) {
            const angle = (i / imageCount) * Math.PI * 2;
            const imgSize = Math.min(width, height) / (3 + imageCount * 0.2);
            
            const resized = await images[i].img
              .resize(imgSize, imgSize, { fit: 'cover' })
              .toBuffer();
            
            composites.push({
              input: resized,
              top: centerY + Math.sin(angle) * radius - imgSize/2,
              left: centerX + Math.cos(angle) * radius - imgSize/2,
              blend: 'over' as Blend
            });
          }
          break;

        case 'spiral':
          // Arrange images in a spiral
          const spiralCenterX = width / 2;
          const spiralCenterY = height / 2;
          const spiralRadius = Math.min(width, height) * 0.4;
          const turns = 2;
          
          for (let i = 0; i < images.length; i++) {
            const progress = i / imageCount;
            const angle = progress * Math.PI * 2 * turns;
            const currentRadius = progress * spiralRadius;
            const imgSize = 50 + (1 - progress) * 100;
            
            const resized = await images[i].img
              .resize(imgSize, imgSize, { fit: 'cover' })
              .toBuffer();
            
            composites.push({
              input: resized,
              top: spiralCenterY + Math.sin(angle) * currentRadius - imgSize/2,
              left: spiralCenterX + Math.cos(angle) * currentRadius - imgSize/2,
              blend: 'over' as Blend
            });
          }
          break;

        case 'grid':
        default:
          // Arrange images in a grid
          const cols = Math.ceil(Math.sqrt(imageCount));
          const rows = Math.ceil(imageCount / cols);
          const cellWidth = (width - (cols + 1) * spacing) / cols;
          const cellHeight = (height - (rows + 1) * spacing) / rows;
          
          for (let i = 0; i < images.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            const resized = await images[i].img
              .resize(
                Math.floor(cellWidth),
                Math.floor(cellHeight),
                { fit: 'inside' }
              )
              .toBuffer();
            
            composites.push({
              input: resized,
              top: row * (cellHeight + spacing) + spacing,
              left: col * (cellWidth + spacing) + spacing,
              blend: 'over' as Blend
            });
          }
      }

      const buffer = await collage
        .composite(composites)
        .toFormat(format as 'jpeg' | 'png')
        .toBuffer();

      return new Response(buffer, {
        headers: {
          'Content-Type': `image/${format}`,
          'X-Collage-Images': files.length.toString(),
        },
      });
    } catch (error) {
      console.error('Collage creation error:', error);
      return c.text('Error creating collage', 500);
    }
  }
};