import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";
import { Context } from "hono";

export const bgRemoveRoute = {
    route: createRoute({
        method: "post",
        path: "/remove-bg",
        tags: ["Image Effects"],
        summary: "Remove image background",
        description: "Automatically remove background from image",
        request: {
            body: {
                content: {
                    "multipart/form-data": {
                        schema: z.object({
                            image: z
                                .any()
                                .describe("Image file to process")
                                .openapi({
                                    type: "string",
                                    format: "binary",
                                }),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Image with background removed",
                content: {
                    "image/png": {
                        schema: z.string().openapi({
                            type: "string",
                            format: "binary",
                        }),
                    },
                    "image/jpeg": {
                        schema: z.string().openapi({
                            type: "string",
                            format: "binary",
                        }),
                    },
                },
            },
        },
    }),
    handler: async (c: Context) => {
        const formData = await c.req.formData();
        const file = formData.get("image");

        if (!(file instanceof File)) {
            return c.text("Image is required", 400);
        }

        try {
            const buffer = await file.arrayBuffer();
            const blob = new Blob([buffer], { type: file.type });

            // Remove background
            const blobResult = await removeBackground(blob, {
                fetchArgs: {
                    mode: "no-cors",
                },
            });
            const arrayBuffer = await blobResult.arrayBuffer();

            // Convert to desired format
            let result = sharp(Buffer.from(arrayBuffer));

            result = result.png();

            const output = await result.toBuffer();

            return new Response(output, {
                headers: {
                    "Content-Type": `image/png`,
                },
            });
        } catch (error) {
            console.error("Background removal error:", error);
            return c.text("Error removing background", 500);
        }
    },
};
