const dayjs = require('@abtnode/util/lib/dayjs');
const { createDownloadLogStream } = require('@abtnode/core/lib/util/log');
const formatContext = require('@abtnode/util/lib/format-context');
const { isValid: isValidDid } = require('@arcblock/did');
const { getStatusFromError } = require('@blocklet/error');

const mutateBlockletPermission = require('../middlewares/mutate-blocklet-permission');

module.exports = {
  init(app, node) {
    const ensurePermission = mutateBlockletPermission(node);

    app.get('/api/download/log/:did', ensurePermission, async (req, res) => {
      const { did } = req.params;
      const { days } = req.query;

      if (!isValidDid(did)) {
        res.status(400).send('Invalid DID format provided');
        return;
      }

      if (days > 7) {
        res.status(400).send('Interval should not > 1 week');
        return;
      }

      try {
        const stream = await createDownloadLogStream({ node, did, days });

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment;filename=${did}.${dayjs().format('YYYYMMDDHHmmss')}.log.zip`);

        stream.pipe(res);

        node
          .createAuditLog(
            {
              action: 'downloadLog',
              args: { teamDid: did, days },
              context: formatContext(req),
              result: {},
            },
            node
          )
          .catch(console.error);
      } catch (error) {
        res.status(getStatusFromError(error)).send(error.message);
      }
    });
  },
};
