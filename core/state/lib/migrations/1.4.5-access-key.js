const { ROLES } = require('@abtnode/constant');

module.exports = async ({ states, printInfo }) => {
  printInfo('Ensure passport of each accessKey ...');

  const list = await states.accessKey.list();
  for (const x of list) {
    if (x && !x.passport) {
      printInfo(`Bind passport "${ROLES.ADMIN}" to accessKey ${x.accessKeyId}`);
      // eslint-disable-next-line no-await-in-loop
      await states.accessKey.update({
        accessKeyId: x.accessKeyId,
        remark: x.remark,
        passport: ROLES.ADMIN,
      });
    }
  }
};
