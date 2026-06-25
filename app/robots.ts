import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/carer", "/family", "/superadmin", "/api/", "/settings", "/clients", "/staff", "/visits", "/rota", "/payroll", "/invoicing", "/reports", "/compliance", "/nutrition", "/emergency"],
      },
    ],
    sitemap: "https://www.careroot.co.uk/sitemap.xml",
    host: "https://www.careroot.co.uk",
  };
}
