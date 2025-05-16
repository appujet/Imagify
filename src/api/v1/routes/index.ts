import { OpenAPIHono } from '@hono/zod-openapi';
import { colorRoute } from './color';
import { compressRoute } from './compress';
import { invertRoute } from './invert';
import { blurRoute } from './blur';
import { grayscaleRoute } from './grayscale';
import { resizeRoute } from './resize';
import { cropRoute } from './crop';
import { rotateRoute } from './rotate';
import { compositeRoute } from './composite';
import { edgeRoute } from './edge';
import { metadataRoute } from './metadata';
import { qrcodeRoute } from './qrcode';


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