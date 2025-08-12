import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";
import type { Plugin } from "postcss";

const config = {
  plugins: [tailwindcss() as Plugin, autoprefixer() as Plugin],
};

export default config;
