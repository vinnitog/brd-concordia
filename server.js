const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const publicRoot = path.join(__dirname, "public");
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
};

function createPreviewServer() {
  return http.createServer(async (request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" });
      return response.end();
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    } catch {
      response.writeHead(400);
      return response.end("Requisição inválida.");
    }
    const relative = pathname === "/" ? "index.html" : pathname.slice(1);
    // Only public, explicitly supported assets can be served by the preview.
    if (!/^[a-zA-Z0-9_./-]+$/.test(relative) || relative.split("/").some(part => part.startsWith("."))) {
      response.writeHead(404);
      return response.end("Arquivo não encontrado.");
    }
    const filePath = path.resolve(publicRoot, relative);
    const contentType = contentTypes[path.extname(filePath)];
    if (!filePath.startsWith(publicRoot + path.sep) || !contentType) {
      response.writeHead(404);
      return response.end("Arquivo não encontrado.");
    }
    try {
      const actualPath = await fs.realpath(filePath);
      if (!actualPath.startsWith(publicRoot + path.sep)) {
        response.writeHead(404);
        return response.end("Arquivo não encontrado.");
      }
      const content = await fs.readFile(actualPath);
      response.writeHead(200, { "Content-Type": contentType, "Content-Length": content.length });
      response.end(request.method === "HEAD" ? undefined : content);
    } catch (error) {
      response.writeHead(["ENOENT", "EISDIR", "ENOTDIR"].includes(error.code) ? 404 : 500);
      response.end("Não foi possível carregar o arquivo.");
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 4317);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("PORT deve ser um número inteiro entre 1 e 65535.");
    process.exitCode = 1;
  } else {
    const server = createPreviewServer();
    server.on("error", error => {
      console.error(error.code === "EADDRINUSE" ? `Porta ${port} em uso. Defina PORT para usar outra porta.` : error.message);
      process.exitCode = 1;
    });
    server.listen(port, "127.0.0.1", () => console.log(`BRD Concordia: http://127.0.0.1:${port}`));
  }
}

module.exports = { createPreviewServer };
