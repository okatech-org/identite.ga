import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // jspdf (utilisé par l'export PDF des courriers iBoîte) embarque `fflate`
  // qui référence `worker_threads` dans son bundle CJS — Next refuse de le
  // bundler en SSR. Comme on n'utilise jspdf qu'au clic utilisateur (côté
  // navigateur), on neutralise `worker_threads` en SSR avec un fallback vide.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve ?? {}
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        worker_threads: false,
      }
    }
    return config
  },
}

export default nextConfig
