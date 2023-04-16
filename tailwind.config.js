const defaultTheme = require("tailwindcss/defaultTheme");
/**
 * @type {import('@types/tailwindcss/tailwind-config').TailwindConfig}
 */
module.exports = {
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./node_modules/flowbite-react/**/*.js",
        "./node_modules/flowbite/**/*.js",
        "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter var", ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: {
                    50: "#0a192f",
                },
            },
        },
    },
    plugins: [require("flowbite/plugin")],
};
