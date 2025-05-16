import { OpenAPIHono } from '@hono/zod-openapi';
import { colorRoute } from './color.ts';
import { compressRoute } from './compress.ts';
import { invertRoute } from './invert.ts';
import { blurRoute } from './blur.ts';
import { grayscaleRoute } from './grayscale.ts';
import { resizeRoute } from './resize.ts';
import { cropRoute } from './crop.ts';
import { rotateRoute } from './rotate.ts';
import { compositeRoute } from './composite.ts';
import { edgeRoute } from './edge.ts';
import { metadataRoute } from './metadata.ts';
import { qrcodeRoute } from './qrcode.ts';


export const routes = new OpenAPIHono();

routes.openapi(colorRoute.route, colorRoute.handler);
routes.openapi(compressRoute.route, compressRoute.handler);
routes.openapi(invertRoute.route, invertRoute.handler);
routes.openapi(blurRoute.route, blurRoute.handler);
routes.openapi(grayscaleRoute.route, grayscaleRoute.handler);
routes.openapi(resizeRoute.route, resizeRoute.handler);
routes.openapi(cropRoute.route, cropRoute.handler);
routes.openapi(rotateRoute.route, rotateRoute.handler);
routes.openapi(compositeRoute.route, compositeRoute.handler);
routes.openapi(edgeRoute.route, edgeRoute.handler);
routes.openapi(metadataRoute.route, metadataRoute.handler);
routes.openapi(qrcodeRoute.route, qrcodeRoute.handler);