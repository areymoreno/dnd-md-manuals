import type { NextConfig } from "next";

/**
 * `DESKTOP=1` compila a ficheros estáticos para empaquetar con Electron. Sin
 * esa variable el proyecto se construye como siempre y el despliegue web no se
 * entera de nada.
 */
const nextConfig: NextConfig = {
  ...(process.env.DESKTOP === "1"
    ? { output: "export" as const, images: { unoptimized: true } }
    : {}),
};

export default nextConfig;
