const {
    createRoutesFromFolders,
} = require("@remix-run/v1-route-convention");

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
    serverBuildTarget: "vercel",
    // When running locally in development mode, we use the built in remix
    // server. This does not understand the vercel lambda module format,
    // so we default back to the standard build output.
    server: process.env.NODE_ENV === "development" ? undefined : "./server.js",
    ignoredRouteFiles: ["**/.*"],
    tailwind: true,
    postcss: true,
    routes(defineRoutes) {
        // uses the v1 convention, works in v1.15+ and v2
        return createRoutesFromFolders(defineRoutes);
    },
    serverDependenciesToBundle: [
        /^remix-utils.*/,
        "react-loader-spinner"
    ],
    // appDirectory: "app",
    // assetsBuildDirectory: "public/build",
    // publicPath: "/build/",
};
