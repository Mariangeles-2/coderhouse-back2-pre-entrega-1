export default {
  // 🎨 Configuración de Prettier para consistencia de código
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,
  endOfLine: 'lf',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  quoteProps: 'as-needed',
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',
  embeddedLanguageFormatting: 'auto',

  // 🔧 Configuraciones específicas por tipo de archivo
  overrides: [
    {
      files: '*.json',
      options: {
        tabWidth: 2,
        trailingComma: 'none',
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
  ],
};
