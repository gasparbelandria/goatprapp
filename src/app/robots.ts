import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Block AI training / image-harvesting bots entirely
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
          "Amazonbot",
          "Bytespider",
          "PetalBot",
          "ImagesiftBot",
          "FacebookBot",
          "Applebot-Extended",
        ],
        disallow: "/",
      },
      // General crawlers: allow only public marketing pages.
      // User profile pages (/{username}) and all app pages are blocked —
      // they serve Supabase storage URLs which cause egress when crawled.
      {
        userAgent: "*",
        allow: [
          "/$",
          "/login",
          "/signup",
          "/terms",
          "/privacy",
          "/help",
          "/robots.txt",
          "/sitemap.xml",
          "/favicon.ico",
        ],
        disallow: "/",
      },
    ],
    sitemap: "https://goatpr.app/sitemap.xml",
  };
}
