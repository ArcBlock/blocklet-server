function extractMarkdownLinks(text) {
  if (!text) {
    return [];
  }

  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const matches = [];
  let match;

  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      text: match[1],
      url: match[2],
    });
  }

  return matches;
}

export default extractMarkdownLinks;
