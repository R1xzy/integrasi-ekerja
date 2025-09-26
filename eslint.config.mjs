import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn", // Ubah dari error ke warning
      "@typescript-eslint/no-unused-vars": "warn", // Ubah dari error ke warning
      "@typescript-eslint/ban-ts-comment": "warn", // Ubah dari error ke warning
      "prefer-const": "warn", // Ubah dari error ke warning
      "react/no-unescaped-entities": "warn", // Ubah dari error ke warning
      "@typescript-eslint/no-require-imports": "warn", // Ubah dari error ke warning
      "react-hooks/exhaustive-deps": "warn", // Ubah dari error ke warning
      "@next/next/no-img-element": "warn", // Ubah dari error ke warning
      "import/no-anonymous-default-export": "warn" // Ubah dari error ke warning
    }
  }
];

export default eslintConfig;
