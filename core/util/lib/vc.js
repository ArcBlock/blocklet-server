const getVcFromPresentation = (presentation) => {
  const vcString = Array.isArray(presentation.verifiableCredential)
    ? presentation.verifiableCredential[0]
    : presentation.verifiableCredential;

  return JSON.parse(vcString);
};

module.exports = {
  getVcFromPresentation,
};
