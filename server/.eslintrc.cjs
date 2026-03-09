module.exports = {
    root: true,
    env: {
        node: true,
        es2022: true,
        jest: true,
    },
    extends: ['eslint:recommended'],
    ignorePatterns: ['node_modules/', 'Assets/', 'coverage/'],
    parserOptions: {
        ecmaVersion: 'latest',
    },
    rules: {
        'no-unused-vars': 'off',
        'no-empty': 'off',
        'no-control-regex': 'off',
    },
};
