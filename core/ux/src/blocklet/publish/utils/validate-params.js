import { PROJECT } from '@blocklet/constant';
import { UNOWNED_DID } from '@abtnode/constant';

import semver from 'semver';

export const validateParams = ({ params, projectId, status, t }) => {
  const errors = [];
  if (!params.blockletTitle) {
    errors.push({ param: 'blockletTitle', message: t('blocklet.publish.errorTip.noTitle') });
  }
  if (!projectId || projectId === UNOWNED_DID) {
    errors.push({ param: 'projectId', message: t('blocklet.publish.errorTip.noDid') });
  }
  if (!params.blockletVersion) {
    errors.push({ param: 'blockletVersion', message: t('blocklet.publish.errorTip.noVersion') });
  } else if (!semver.valid(params.blockletVersion)) {
    errors.push({ param: 'blockletVersion', message: t('blocklet.publish.errorTip.inValidVersion') });
  }
  if (status === PROJECT.RELEASE_STATUS.published) {
    if (!params.blockletDescription) {
      errors.push({ param: 'blockletDescription', message: t('blocklet.publish.errorTip.noDescription') });
    }
    if (!params.note) {
      errors.push({ param: 'note', message: t('blocklet.publish.errorTip.noNote') });
    }
  }

  return errors.length ? errors : null;
};

export const validateParamsStep = ({ params, step, t, projectId }) => {
  if (step === 0) {
    if (!params.blockletTitle) {
      return t('blocklet.publish.errorTip.noTitle');
    }
    if (!projectId || projectId === UNOWNED_DID) {
      return t('blocklet.publish.errorTip.noDid');
    }
    if (!params.blockletDescription) {
      return t('blocklet.publish.errorTip.noDescription');
    }
  }
  if (step >= 4) {
    if (!params.blockletVersion) {
      return t('blocklet.publish.errorTip.noVersion');
    }
    if (!semver.valid(params.blockletVersion)) {
      return t('blocklet.publish.errorTip.inValidVersion');
    }
    if (!params.note) {
      return t('blocklet.publish.errorTip.noNote');
    }
  }
  return '';
};
