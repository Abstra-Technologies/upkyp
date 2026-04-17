import type { MetadataRoute } from 'next';

const baseUrl = 'https://www.upkyp.com'; // Change to your production domain

// List of popular locations/cities you want to include as filtered URLs
const popularLocations = [
    'manila',
    'quezon city',
    'makati',
    'cebu',
    "cavite",
    'davao',
    'taguig',
    'pasig',
    'baguio',
    'boracay', // add more as needed
    // You can also use lowercase slugs if your data uses that
];

export default function sitemap(): MetadataRoute.Sitemap {
    const staticPages = [
        // Add your main static pages here
        { url: `${baseUrl}/`, lastModified: new Date(), priority: 1.0 },
        { url: `${baseUrl}/find-rent`, lastModified: new Date(), priority: 0.9 },
        // Add other pages like /about, /contact, etc.
    ];

    // Generate filtered search URLs
    const filteredUrls = popularLocations.flatMap((location) => {
        const capitalized = location.charAt(0).toUpperCase() + location.slice(1);
        return [
            {
                url: `${baseUrl}/find-rent?searchQuery=${encodeURIComponent(location)}`,
                lastModified: new Date(),
                changeFrequency: 'daily' as const,
                priority: 0.8,
            },
            {
                url: `${baseUrl}/find-rent?searchQuery=${encodeURIComponent(capitalized)}`,
                lastModified: new Date(),
                changeFrequency: 'daily' as const,
                priority: 0.8,
            },
            {
                url: `${baseUrl}/find-rent?location=${encodeURIComponent(location.toLowerCase())}`,
                lastModified: new Date(),
                changeFrequency: 'daily' as const,
                priority: 0.7,
            },
        ];
    });

    return [...staticPages, ...filteredUrls];
}