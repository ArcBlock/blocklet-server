const request = require('./request');
const { filterDuplicateComponents, parseComponents } = require('./blocklet');

/**
 * @param {String} url
 * @returns {Promise<import('@abtnode/types').TComponentState[]>}
 */
async function getDynamicComponents({ url }) {
  const rawMeta = await request.get(url).then((res) => res.data);
  const { dynamicComponents } = await parseComponents({ meta: rawMeta });

  const components = filterDuplicateComponents(dynamicComponents);

  const requiredComponents = {};
  rawMeta.components?.forEach((component) => {
    if (component.required) {
      requiredComponents[component.source?.name || component.name] = true;
    }
  });

  const subRequiredComponents = {};
  components.forEach((component) => {
    component.required = !!requiredComponents[component.meta?.name || component.meta?.did];
    if (component.required && component.meta?.components) {
      component.meta.components.forEach((subComponent) => {
        if (subComponent.required) {
          if (subComponent.source?.name) {
            subRequiredComponents[subComponent.source?.name] = true;
          }
          subRequiredComponents[subComponent.name] = true;
        }
      });
    }
  });
  components.forEach((component) => {
    if (subRequiredComponents[component.meta?.name || component.meta?.did]) {
      component.required = true;
    }
  });

  // eslint-disable-next-line no-nested-ternary
  components.sort((a, b) => (a.required === b.required ? 0 : a.required ? -1 : 1));

  return components;
}

module.exports = getDynamicComponents;
