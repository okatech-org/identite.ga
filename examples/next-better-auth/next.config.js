/** @type {import('next').NextConfig} */
const nextConfig = {
  // Better Auth utilise des modules CommonJS / Node natifs (better-sqlite3) qui
  // ne sont pas bundlables côté webpack — on les déclare externes.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
