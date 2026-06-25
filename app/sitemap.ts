import { MetadataRoute } from "next";

const BASE = "https://www.careroot.co.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/features`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/demo`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/gp-connect`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/custom-app`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/white-label`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/reports`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/solutions/domiciliary`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/solutions/supported-living`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/solutions/residential`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/solutions/nhs`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/solutions/new-agencies`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/solutions/cqc-registration`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
