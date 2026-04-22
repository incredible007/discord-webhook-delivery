// @ts-check
import eslint from '@eslint/js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import drizzle from 'eslint-plugin-drizzle'

export default tseslint.config(
    {
        ignores: ['eslint.config.ts', 'README.md'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintPluginPrettierRecommended,
    {
        plugins: {
            'simple-import-sort': simpleImportSort,
            drizzle,
        },
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                projectService: true,
                tsconfigRootDir: __dirname,
            },
        },
        rules: {
            // ==================== TypeScript ====================
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-floating-promises': 'warn',
            '@typescript-eslint/no-unsafe-argument': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/consistent-type-imports': [
                'warn',
                {
                    prefer: 'type-imports',
                    fixStyle: 'inline-type-imports',
                },
            ],
            '@typescript-eslint/no-misused-promises': [
                'error',
                {
                    checksVoidReturn: {
                        arguments: false,
                        properties: false,
                    },
                },
            ],

            // ==================== Imports ====================
            'simple-import-sort/imports': [
                'warn',
                {
                    groups: [
                        // NestJS & external packages
                        ['^@nestjs', '^@?\\w'],
                        // Inner aliases (@/)
                        ['^@/'],
                        // Relative imports
                        ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
                        ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
                    ],
                },
            ],
            'simple-import-sort/exports': 'warn',

            // ==================== Drizzle ====================
            'drizzle/enforce-delete-with-where': 'error',
            'drizzle/enforce-update-with-where': 'error',

            // ==================== Common ====================
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'prefer-const': 'warn',
            'no-var': 'error',
            'object-shorthand': 'warn',
        },
    },
)
