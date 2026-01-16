/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**", // Yıldız koyarak "Tüm sitelere güven" dedik.
            },
        ],
    },
};

export default nextConfig;