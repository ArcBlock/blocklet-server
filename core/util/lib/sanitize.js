const { initSanitize } = require('@blocklet/xss');

/**
 * Sanitize user input by removing any HTML tags from the content
 * @param {*} content
 * @returns
 */
const sanitizeTag = (content) => {
  if (!content || typeof content !== 'string') {
    return content;
  }

  const sanitize = initSanitize({
    whiteList: {},
    stripIgnoreTag: false,
    stripIgnoreTagBody: [],
    onIgnoreTag: (tag, html) => html.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    onIgnoreTagAttr: (tag, name, value) => `${name}="${value}"`,
    onTag: (tag, html) => html.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    escapeHtml: (html) => html.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
  });
  return sanitize(content);
};

/**
 * Escape HTML tags in the given content
 * @param {*} content
 * @returns
 */
const escapeTag = (content) => {
  if (!content || typeof content !== 'string') {
    return content;
  }

  const sanitize = initSanitize({
    whiteList: {},
    stripIgnoreTag: false,
    onIgnoreTag: (tag, html) => html.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    onIgnoreTagAttr: (tag, name, value) => {
      return `${name}="${value}"`;
    },
    stripIgnoreTagBody: [],
    escapeHtml: (html) => {
      return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
  });
  return sanitize(content);
};

module.exports = {
  sanitizeTag,
  escapeTag,
};
