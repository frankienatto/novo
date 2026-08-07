import { Router, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { rateLimiters } from '../middlewares/rateLimitMiddleware.ts';

export const docsRouter = Router();

// Aplica o rate limiter apropriado
docsRouter.use(rateLimiters.health);

/**
 * GET /api/docs/openapi.json
 * Retorna o arquivo de especificação OpenAPI 3.0.3 em formato JSON
 */
docsRouter.get('/openapi.json', (_req: Request, res: Response) => {
  try {
    const specPath = path.join(process.cwd(), 'server', 'docs', 'openapi.json');
    if (!fs.existsSync(specPath)) {
      return res.status(404).json({
        status: 'ERROR',
        error: 'Arquivo de especificação OpenAPI não encontrado.',
      });
    }

    const openApiContent = fs.readFileSync(specPath, 'utf-8');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).send(openApiContent);
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao carregar documentação OpenAPI.',
      details: err?.message || String(err),
    });
  }
});

/**
 * GET /api/docs
 * Serve a interface interativa Swagger UI
 */
docsRouter.get('/', (_req: Request, res: Response) => {
  const swaggerHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Synapse Hospitality API Documentation (Swagger UI)</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5/favicon-32x32.png" sizes="32x32" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; font-family: sans-serif; }
    .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { font-family: sans-serif; color: #1e293b; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/api/docs/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout",
        docExpansion: "list",
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        showExtensions: true,
        showCommonExtensions: true
      });
    };
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(swaggerHtml);
});
