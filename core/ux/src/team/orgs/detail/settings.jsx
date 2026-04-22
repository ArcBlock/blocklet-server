import { useMemo, useState } from 'react';
import InfoRow from '@arcblock/ux/lib/InfoRow';
import get from 'lodash/get';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { InfoOutlined, Delete as DeleteIcon } from '@mui/icons-material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useMemoizedFn } from 'ahooks';
import pick from 'lodash/pick';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
// eslint-disable-next-line import/no-unresolved
import AvatarUploader from '@blocklet/ui-react/lib/common/org-switch/avatar-uploader';

import { useOrgsContext } from '../context';
import Tooltip from '../../../tooltip';
import FormTextInput from '../../../form/form-text-input';

export default function OrgSettings() {
  const { orgDetail, requests } = useOrgsContext();
  const { org, loading, editable } = orgDetail || {};
  const { t, locale } = useLocaleContext();
  const navigate = useNavigate();
  const [uploadedAvatarPath, setUploadedAvatarPath] = useState(null);

  const maxMembersPreOrg = useMemo(() => {
    const { settings = {} } = window.blocklet || {};
    return get(settings, 'org.maxMemberPerOrg', 100);
  }, []);

  const onUpdateOrg = useMemoizedFn(async (field, value) => {
    const newOrg = {
      ...pick(org, ['id', 'name', 'description']),
      [field]: value,
    };
    // 如果有新上传的 avatar，添加到 newOrg
    if (uploadedAvatarPath && field !== 'avatar') {
      newOrg.avatar = uploadedAvatarPath;
      setUploadedAvatarPath(null);
    }
    await requests.updateOrg(newOrg);
    orgDetail.refresh(newOrg.id);
  });

  const handleAvatarChange = useMemoizedFn((avatarPath) => {
    // 保存上传的 avatar 路径
    setUploadedAvatarPath(avatarPath);
    // 立即更新 org，包含 avatar
    const newOrg = {
      ...pick(org, ['id', 'name', 'description']),
      avatar: avatarPath,
    };
    requests.updateOrg(newOrg).then(() => {
      orgDetail.refresh(newOrg.id);
      setUploadedAvatarPath(null);
    });
  });

  const handleRemoveOrg = useMemoizedFn(async () => {
    await requests.deleteOrg(org);
    navigate(`${WELLKNOWN_SERVICE_PATH_PREFIX}/user/orgs?locale=${locale}`);
  });

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 2,
        }}>
        <InfoRow valueComponent="div" key="avatar" nameWidth={180} name={t('common.avatar')}>
          <AvatarUploader org={org} editable={editable} size={80} onChange={handleAvatarChange} />
        </InfoRow>
        <InfoRow valueComponent="div" key="name" nameWidth={180} name={t('team.orgs.mutate.name')}>
          {editable ? (
            <FormTextInput
              style={{ marginTop: 0 }}
              disabled={loading}
              loading={loading}
              initialValue={org.name}
              onSubmit={(value) => onUpdateOrg('name', value)}
            />
          ) : (
            org.name
          )}
        </InfoRow>
        <InfoRow valueComponent="div" key="description" nameWidth={180} name={t('common.description')}>
          {editable ? (
            <FormTextInput
              style={{ marginTop: 0 }}
              disabled={loading}
              loading={loading}
              initialValue={org.description}
              type="textarea"
              rows={3}
              onSubmit={(value) => onUpdateOrg('description', value)}
            />
          ) : (
            org.description
          )}
        </InfoRow>
        <InfoRow
          valueComponent="div"
          key="maxMembers"
          nameWidth={180}
          name={
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {t('team.orgs.invite.maxMembers')}
              <Tooltip title={t('team.orgs.invite.maxMembersTip')}>
                <InfoOutlined fontSize="small" sx={{ cursor: 'pointer', fontSize: 14 }} />
              </Tooltip>
            </Typography>
          }>
          {maxMembersPreOrg}
        </InfoRow>
      </Box>
      {editable && (
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<DeleteIcon style={{ fontSize: 16 }} />}
            onClick={handleRemoveOrg}>
            {t('team.orgs.deleteOrg')}
          </Button>
        </Box>
      )}
    </Box>
  );
}
