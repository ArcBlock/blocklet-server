const parseJsonText = (text, key) => {
  if (!text) {
    return '';
  }
  try {
    return key ? JSON.parse(text)[key] : JSON.parse(text);
  } catch (e) {
    //
  }
  return text;
};

export default parseJsonText;
