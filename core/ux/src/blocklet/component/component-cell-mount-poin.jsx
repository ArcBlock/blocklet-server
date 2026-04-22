import normalizePathPrefix from '@abtnode/util/lib/normalize-path-prefix';
import { useConfirm } from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import { urlPathFriendly } from '@blocklet/meta/lib/url-path-friendly';
import { Icon } from '@iconify/react';
import { Box, CircularProgress, IconButton, TextField, Typography } from '@mui/material';
import { useMemoizedFn } from 'ahooks';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { formatError } from '@blocklet/error';

import { useNodeContext } from '../../contexts/node';

function ComponentCellMountPoint({ blocklet, ancestors, mountPoint, href }) {
  const [hover, setHover] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editValue, setEditValue] = useState(mountPoint);
  const { api } = useNodeContext();
  const isRoot = !ancestors.length;
  const rootDid = isRoot ? blocklet.meta.did : ancestors.map((x) => x.meta.did)[0];
  const { t } = useLocaleContext();
  const { confirmApi, confirmHolder } = useConfirm();

  useEffect(() => {
    setEditing(false);
    setHover(false);
    setLoading(false);
  }, [mountPoint]);

  const handleCancel = () => {
    setHover(false);
    setEditing(false);
    setEditValue(mountPoint);
  };

  const onSubmitMountPoint = async () => {
    setLoading(true);
    setHover(false);
    try {
      const input = { rootDid, mountPoint: urlPathFriendly(editValue) };

      if (!isRoot) {
        input.did = blocklet.meta.did;
      }

      await api.updateComponentMountPoint({ input });
    } catch (err) {
      err.message = formatError(err);
      Toast.error(err.message);
      throw err;
    } finally {
      handleCancel();
    }
  };

  const showConfirmDialog = useMemoizedFn(() => {
    confirmApi.open({
      title: t('common.noticeTitle'),
      content: (
        <Box sx={{ color: '#9397A1', '& > li': { listStyle: 'disc', ml: 1.5 } }}>
          <Typography sx={{ mb: 1.5 }}>{t('blocklet.mountPoint.description1')}</Typography>
          <Typography component="li">{t('blocklet.mountPoint.case1')}</Typography>
          <Typography component="li">{t('blocklet.mountPoint.case2')}</Typography>
          <Typography sx={{ mt: 1.5 }}>{t('blocklet.mountPoint.description2')}</Typography>
        </Box>
      ),
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      async onConfirm(close) {
        await onSubmitMountPoint();
        close();
      },
      confirmButtonProps: {
        'data-cy': 'edit-mount-point-confirm',
      },
    });
  });

  const onShowDialog = (e) => {
    e?.preventDefault();
    if (urlPathFriendly(editValue) !== mountPoint) {
      showConfirmDialog();
    } else {
      setEditing(false);
    }
  };

  const tools = editing ? (
    <Box sx={{ ml: 1 }}>
      <IconButton
        size="medium"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        data-cy="edit-mount-point-submit"
        onClick={onShowDialog}>
        <Box component={Icon} icon="material-symbols:done" sx={{ color: 'primary.main', transition: '0.3s opacity' }} />
      </IconButton>
      <IconButton
        size="medium"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={handleCancel}>
        <Box component={Icon} icon="iconoir:cancel" sx={{ color: 'primary.main', transition: '0.3s opacity' }} />
      </IconButton>
    </Box>
  ) : (
    <IconButton
      size="medium"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => setEditing(true)}>
      <Box
        component={Icon}
        data-cy="edit-mount-point"
        icon="lets-icons:edit-light"
        sx={{ opacity: hover ? 1 : 0, color: 'primary.main', transition: '0.3s opacity' }}
      />
    </IconButton>
  );

  return (
    <Box
      key={mountPoint}
      sx={{
        alignItems: 'center',
        flexGrow: '1',
        display: { xs: 'none', md: 'flex' },
      }}>
      {confirmHolder}
      {editing ? (
        <form onSubmit={onShowDialog}>
          <TextField
            style={{ flex: 1 }}
            fullWidth
            data-cy="edit-mount-point-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            size="small"
            variant="outlined"
            placeholder={mountPoint}
          />
        </form>
      ) : (
        <Box
          component="a"
          target="_blank"
          href={href}
          rel="noopener noreferrer"
          title={href}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}>
          <Box
            sx={{
              maxWidth: 400,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              color: 'primary.main',
              fontSize: 16,
              px: 2,
            }}>
            {normalizePathPrefix(mountPoint)}
          </Box>
        </Box>
      )}
      {loading ? <CircularProgress size={20} sx={{ ml: 1 }} /> : tools}
    </Box>
  );
}

ComponentCellMountPoint.propTypes = {
  mountPoint: PropTypes.string.isRequired,
  href: PropTypes.string.isRequired,
  blocklet: PropTypes.object.isRequired,
  ancestors: PropTypes.array.isRequired,
};

export default ComponentCellMountPoint;
