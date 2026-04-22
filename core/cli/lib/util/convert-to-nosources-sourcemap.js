const fs = require('fs');
const { SourceMapConsumer, SourceMapGenerator } = require('source-map');

async function convertToNoSourcesSourceMap(inputMapPath, outputMapPath) {
  if (!fs.existsSync(inputMapPath)) {
    return;
  }
  const rawSourceMap = JSON.parse(fs.readFileSync(inputMapPath, 'utf8'));

  const consumer = await new SourceMapConsumer(rawSourceMap);

  const generator = new SourceMapGenerator({
    file: rawSourceMap.file,
    sourceRoot: rawSourceMap.sourceRoot,
  });

  consumer.eachMapping((mapping) => {
    generator.addMapping({
      generated: {
        line: mapping.generatedLine,
        column: mapping.generatedColumn,
      },
      source: mapping.source,
      original: mapping.source
        ? {
            line: mapping.originalLine,
            column: mapping.originalColumn,
          }
        : null,
      name: mapping.name,
    });
  });

  fs.writeFileSync(outputMapPath, JSON.stringify(generator.toJSON()));
}

module.exports = convertToNoSourcesSourceMap;
