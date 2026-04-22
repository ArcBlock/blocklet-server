/**
 * Org 卡片项
 */
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useMemoizedFn } from 'ahooks';
import { Box, Typography, Button, Chip, Stack, Card, CardHeader, CardContent, Skeleton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { People as PeopleIcon, Delete as DeleteIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import noop from 'lodash/noop';

import { useSessionContext } from '../../../contexts/session';

export default function OrgCardItem({
  org,
  onInviteUser = noop,
  onDelete = noop,
  onClick = noop,
  loading = false,
  editable = true,
}) {
  const { t } = useLocaleContext();
  const { session } = useSessionContext();

  const isOwner = useMemo(() => {
    return session?.user?.did === org.ownerDid;
  }, [session?.user?.did, org.ownerDid]);

  const renderActions = () => {
    if (editable) {
      return (
        <>
          <ButtonWrapper
            variant="outlined"
            size="small"
            startIcon={<PersonAddIcon style={{ fontSize: 16 }} />}
            onClick={(e) => {
              e.stopPropagation();
              onInviteUser?.(org);
            }}>
            {t('common.invite')}
          </ButtonWrapper>

          <ButtonWrapper
            variant="contained"
            color="error"
            size="small"
            startIcon={<DeleteIcon style={{ fontSize: 16 }} />}
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(org);
            }}>
            {t('common.delete')}
          </ButtonWrapper>
        </>
      );
    }
    return null;
  };

  const renderOwnerChip = useMemoizedFn(() => {
    if (isOwner) {
      return null;
    }
    if (org?.passports?.length > 0) {
      return <Chip label={org.passports[0].title} size="small" />;
    }
    return null;
  });

  return (
    <Stack
      sx={{
        flexDirection: {
          xs: 'column',
          md: 'row',
        },
        gap: {
          xs: 2,
          md: 2,
        },
        cursor: 'pointer',
        minWidth: 300,
      }}
      onClick={() => onClick?.(org)}>
      <Card
        sx={{
          boxShadow: 1,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.default',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}>
        <CardHeader
          title={
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              {loading ? (
                <Skeleton variant="text" width="100%" height={24} />
              ) : (
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {org.name}
                </Typography>
              )}

              {loading ? <Skeleton variant="text" width={50} height={24} /> : renderOwnerChip()}
            </Stack>
          }
          sx={{ pb: 2 }}
        />

        <CardContent
          sx={{
            pt: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            '&.MuiCardContent-root': {
              pb: 2,
            },
          }}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              height: 56,
            }}>
            {loading ? (
              <>
                <Skeleton variant="text" width="100%" height={24} />
                <Skeleton variant="text" width="80%" height={24} />
              </>
            ) : (
              org.description
            )}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {loading ? (
              <Skeleton variant="text" width="30%" height={24} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: 14 }}>
                <PeopleIcon sx={{ fontSize: '18px' }} />
                <span>
                  {org.membersCount || org.members?.length || 1} {t('team.orgs.members')}
                </span>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {loading ? (
                <>
                  <Skeleton variant="text" width={50} height={24} />
                  <Skeleton variant="text" width={50} height={24} />
                </>
              ) : (
                renderActions()
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}

OrgCardItem.propTypes = {
  org: PropTypes.object.isRequired,
  onInviteUser: PropTypes.func,
  onDelete: PropTypes.func,
  onClick: PropTypes.func,
  loading: PropTypes.bool,
  editable: PropTypes.bool,
};

const ButtonWrapper = styled(Button)`
  font-weight: 500;
  .MuiButton-icon {
    margin-right: 4px;
  }
`;

/**
 * {
 *  id: string;
 *  name: string;
 *  description: string;
 *  createdAt: string;
 *  updatedAt: string;
 *  ownerDid: string;
 *  owner: Object; // User
 *  members: Object[];
 *  membersCount: number;
 * }
 */
