import { app } from './api/v1/app.ts';

Deno.serve(app.fetch);