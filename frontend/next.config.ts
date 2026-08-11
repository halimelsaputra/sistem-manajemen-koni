import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['react-chartjs-2'],
  async rewrites() {
    // URL backend. Di lokal default ke localhost:3001 (backend dev).
    // Saat deploy ke Vercel, set env var BACKEND_URL ke URL backend produksi,
    // mis. https://koni-backend.vercel.app
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
