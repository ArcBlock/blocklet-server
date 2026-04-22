const parseResourceRelateComponents = (
  nowBlockletComponents,
  blocklet,
  resourceRelateComponents,
  disabledSelectComponents
) => {
  const blockletComponents = nowBlockletComponents ? [...nowBlockletComponents] : [];
  const componentMaps = (blocklet?.children || []).reduce((acc, curr) => {
    acc[curr.meta.did] = true;
    return acc;
  }, {});

  Object.keys(resourceRelateComponents).forEach((blockletDid) => {
    if (!componentMaps[blockletDid]) {
      return;
    }
    let included = false;
    if (!disabledSelectComponents) {
      blockletComponents.forEach((item) => {
        if (item.did === blockletDid) {
          item.included = true;
          item.required = true;
          included = true;
        }
      });
    }
    if (!included) {
      blockletComponents.push({ did: blockletDid, included: true, required: true });
    }
  });
  return blockletComponents;
};

export default parseResourceRelateComponents;
