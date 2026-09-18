import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
	baseDirectory: import.meta.dirname,
});

const eslintConfig = [
	{
		ignores: [
			"cloudflare-env.d.ts",
			"next-env.d.ts",
			"convex/_generated/**",
			".next/**",
			".next-dev/**",
			".open-next/**",
			".wrangler/**",
		],
	},
	...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
