class Label {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.icon = data.icon;
    this.type = data.type;
    this.color = data.color || '#4B5563';
    this.data = data;
  }

  getName(locale) {
    if (!locale) {
      return this.title;
    }

    return this?.title;
  }
}

export default Label;
