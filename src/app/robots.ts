import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/feed/",
          "/feed",
          "/create/",
          "/create",
          "/my-posts/",
          "/my-posts",
          "/account/",
          "/account",
          "/profile/",
          "/setup/",
          "/setup",
          "/groups/",
          "/groups",
          "/rankings/",
          "/rankings",
          "/admin.html",
        ],
      },
    ],
    sitemap: "https://goatpr.app/sitemap.xml",
  };
}
