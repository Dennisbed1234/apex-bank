import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://apex-bank-theta.vercel.app'
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/about`, lastModified: new Date() },
    { url: `${base}/sign-in`, lastModified: new Date() },
    { url: `${base}/sign-up`, lastModified: new Date() },
  ]
}
