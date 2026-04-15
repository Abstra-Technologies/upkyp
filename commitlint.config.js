// commitlint.config.js
module.exports = {
    extends: ['@commitlint/config-conventional'],

    rules: {
        // 🔤 Type rules
        'type-enum': [
            2,
            'always',
            [
                'feat',
                'fix',
                'refactor',
                'perf',
                'docs',
                'style',
                'test',
                'build',
                'ci',
                'chore',
                'revert',
            ],
        ],

        // 📦 Scope rules (custom for your monorepo)
        'scope-enum': [
            2,
            'always',
            [
                'landlord',
                'tenant',
                'admin',
                'api',
                'auth',
                'billing',
                'units',
                'properties',
                'leasing',
                'payments',
                'ui',
                'core',
                'monorepo',
            ],
        ],

        // ✍️ Message formatting
        'subject-case': [2, 'never', ['upper-case']], // disallow ALL CAPS
        'subject-empty': [2, 'never'],
        'subject-full-stop': [2, 'never', '.'],

        // 📏 Length limits
        'header-max-length': [2, 'always', 100],

        // 🔠 Type casing
        'type-case': [2, 'always', 'lower-case'],

        // 🧹 Scope formatting
        'scope-case': [2, 'always', 'kebab-case'],
    },
};