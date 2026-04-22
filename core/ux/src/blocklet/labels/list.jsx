import { useState } from 'react';
import {
  DeleteOutlineOutlined as DeleteOutlineOutlinedIcon,
  EditOutlined as EditOutlinedIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, IconButton, InputBase, Divider, Typography, alpha, Alert } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Empty from '@arcblock/ux/lib/Empty';
import Toast from '@arcblock/ux/lib/Toast';
import pickBy from 'lodash/pickBy';
import PropTypes from 'prop-types';
import LabelIcon from '@mui/icons-material/LocalOfferOutlined';
import LabelChip from './chip';
import LabelFormDialog from './dialog';
import weakKey from './utils';
import { useTeamContext } from '../../contexts/team';
import { useNodeContext } from '../../contexts/node';
import { formatError } from '../../util';
import { LabelsProvider, useLabels } from './context/context';
import { ConfirmProvider, useConfirm } from './context/confirm';
import LabelPicker from './picker/label';
import Labels from './label';

function LabelReassign({ exclude = undefined, onChange = undefined }) {
  const [value, setValue] = useState([]);
  const { t } = useLocaleContext();

  return (
    <Box sx={{ minHeight: 200 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        {t('label.reassignTip')}
      </Alert>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LabelPicker
          value={[value]}
          onChange={(v) => {
            setValue(v);
            onChange?.(v[0]);
          }}
          trigger={
            <Button color="inherit" variant="outlined" startIcon={<LabelIcon style={{ fontSize: 14 }} />}>
              <Box component="span" sx={{ mr: 1, whiteSpace: 'nowrap' }}>
                {t('label.reassignTo')}
              </Box>

              {!!value.length && <Labels compact={false} labels={value} />}
            </Button>
          }
          multiple={false}
          excludes={[exclude]}
        />
      </Box>
    </Box>
  );
}

LabelReassign.propTypes = {
  exclude: PropTypes.string,
  onChange: PropTypes.func,
};

function LabelManager({ onReload = () => {}, ...rest }) {
  const { t } = useLocaleContext();
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();
  const { confirm } = useConfirm();

  const { labels: data, refetch: run } = useLabels();

  const flattenedLabels = data || [];

  const [editingLabel, setEditingLabel] = useState(null);
  const [search, setSearch] = useState('');

  const filteredLabels = flattenedLabels.filter((x) =>
    `${x.id}-${x.title}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (parentId) => {
    if (!editingLabel) {
      setEditingLabel({ title: 'New label', slug: 'new-label', parentId });
    }
  };

  const handleEdit = (label) => {
    if (editingLabel) {
      return;
    }
    setEditingLabel(label);
  };

  const handleSubmit = async (payload) => {
    const tag = pickBy(payload, (value) => value);

    if (!editingLabel) {
      return;
    }

    try {
      if (editingLabel.id) {
        await api.updateTag({ input: { teamDid, tag } });
      } else {
        await api.createTag({ input: { teamDid, tag } });
      }

      Toast.success(t('label.saveSuccess'));
      setEditingLabel(null);
      run();
      onReload();
    } catch (error) {
      Toast.error(formatError(error));
    }
  };

  const handleDelete = async (node) => {
    let moveTo;
    const proceed = await confirm({
      title: t('label.deleteTip', { name: node.title }),
      description: (
        <Box sx={{ width: 540, maxWidth: '100%' }}>
          <Typography variant="body1">{t('label.deleteDesc', { name: node.title })}</Typography>
          <Box sx={{ py: 2, color: 'grey.800' }}>
            <LabelsProvider>
              <LabelReassign
                exclude={node.id}
                onChange={(v) => {
                  moveTo = v;
                }}
              />
            </LabelsProvider>
          </Box>
        </Box>
      ),
    });

    if (proceed) {
      const input = { teamDid, tag: node };
      if (moveTo) {
        input.moveTo = moveTo;
      }

      await api
        .deleteTag({ input })
        .then(() => {
          run();
          Toast.success(t('label.deleteSuccess'));
          onReload();
        })
        .catch((error) => {
          Toast.error(formatError(error));
        });
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }} {...rest}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h3" />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              component={InputBase}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('label.search')}
              startAdornment={<SearchIcon />}
              sx={(theme) => ({
                width: 300,
                '& input': {
                  p: 1,
                  px: 4.5,
                  borderRadius: 1,
                  backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#0d1117',
                  transition: theme.transitions.create(['border-color', 'box-shadow']),
                  border: `1px solid ${theme.palette.mode === 'light' ? '#eaecef' : '#30363d'}`,
                  fontSize: 14,
                  '&:focus': {
                    boxShadow: `0px 0px 0px 3px ${
                      theme.palette.mode === 'light' ? alpha(theme.palette.primary.light, 0.4) : 'rgb(12, 45, 107)'
                    }`,
                    borderColor: theme.palette.mode === 'light' ? theme.palette.primary.light : '#388bfd',
                  },
                },
                '& .MuiSvgIcon-root': {
                  position: 'absolute',
                  left: 8,
                  fontSize: 20,
                  color: 'grey.700',
                },
              })}
            />

            <Button
              color="primary"
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ textTransform: 'none' }}
              onClick={() => handleCreate()}>
              {t('label.create')}
            </Button>
          </Box>
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filteredLabels.map((label) => {
            return (
              <Box
                key={label.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1,
                  px: 2,
                  border: 1,
                  borderColor: 'grey.300',
                  gap: 1,
                  borderRadius: 1.5,
                }}>
                <Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 0.5,
                        fontSize: 14,
                        color: 'grey.700',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                      }}>
                      <LabelChip label={label} />
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.5, flex: '0 0 auto' }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      color="inherit"
                      size="small"
                      sx={{ color: 'grey.500' }}
                      onClick={() => handleCreate(label.id)}>
                      <AddIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                    <IconButton
                      color="inherit"
                      size="small"
                      sx={{ color: 'grey.500' }}
                      onClick={() => handleEdit(label)}>
                      <EditOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton
                      disabled={label.type === 'system'}
                      size="small"
                      sx={{ color: 'error.main' }}
                      onClick={() => handleDelete(label)}>
                      <DeleteOutlineOutlinedIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            );
          })}
          {filteredLabels?.length === 0 && (
            <Box height={300}>
              <Empty>{t('label.noLabels')}</Empty>
            </Box>
          )}
        </Box>
      </Box>

      <LabelFormDialog
        key={weakKey(editingLabel)}
        open={!!editingLabel}
        onClose={() => setEditingLabel(null)}
        initialValue={editingLabel}
        onSubmit={handleSubmit}
      />
    </>
  );
}

LabelManager.propTypes = {
  onReload: PropTypes.func,
};

function LabelManagerWrapper({ ...rest }) {
  return (
    <ConfirmProvider>
      <LabelsProvider>
        <LabelManager {...rest} />
      </LabelsProvider>
    </ConfirmProvider>
  );
}

LabelManagerWrapper.propTypes = {
  ...LabelManager.propTypes,
};

export default LabelManagerWrapper;
