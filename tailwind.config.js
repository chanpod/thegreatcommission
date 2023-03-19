const defaultTheme = require("tailwindcss/defaultTheme");
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./node_modules/flowbite-react/**/*.js"],
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
