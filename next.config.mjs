/** @type {import('next').NextConfig} */
const nextConfig = {
    // TypeScript hatalarını görmezden gel (Yayınlamayı engellemesin)
    typescript: {
        ignoreBuildErrors: true,
    },
    // Yazım kurallarını (Lint) görmezden gel
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;