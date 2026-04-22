// 兼容 vite 的 svgr 插件，将 import xx from 'xx.svg?react' -> import { ReactComponent as xx } from 'xx.svg'
module.exports = function ({ types: t }) {
  return {
    name: 'transform-react-svg-query',
    visitor: {
      ImportDeclaration(path) {
        const importPath = path.node.source.value;

        if (/\.svg\?react$/.test(importPath)) {
          const varName = path.node.specifiers[0]?.local?.name;
          if (!varName) return;

          // 去掉 ?react
          const newImportPath = importPath.replace(/\?react$/, '');

          path.replaceWith(
            t.importDeclaration(
              [t.importSpecifier(t.identifier(varName), t.identifier('ReactComponent'))],
              t.stringLiteral(newImportPath)
            )
          );
        }
      },
    },
  };
};
