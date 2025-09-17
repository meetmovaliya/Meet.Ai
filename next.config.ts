import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/resume.pdf",
        headers: [
          { key: "Content-Disposition", value: "attachment; filename=\"resume.pdf\"" },
          { key: "Cache-Control", value: "public, max-age=3600" }
        ]
      }
    ];
  }
};

export default nextConfig;
