/* eslint-disable react/no-unstable-nested-components */
import React, { useState } from 'react';
import { useMemoizedFn, useInfiniteScroll, useDebounce, useCreation } from 'ahooks';
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  Box,
  IconButton,
  Typography,
  DialogContentText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@arcblock/ux/lib/Dialog';
import UserCard from '@arcblock/ux/lib/UserCard';
import { CardType, InfoType } from '@arcblock/ux/lib/UserCard/types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import copy from 'copy-to-clipboard';
import get from 'lodash/get';

import { useNodeContext } from '../../../contexts/node';
import { formatError, formatToDatetime } from '../../../util';
import ClickToCopy from '../../../click-to-copy';
import { useOrgsContext } from '../context';
import Tabs from './tabs';

const PAGE_SIZE = 20;

export default function InviteDialog() {
  const { t, locale } = useLocaleContext();
  const { api } = useNodeContext();
  const { inviteParams, teamDid, requests } = useOrgsContext();
  const { showInvite, onTriggerInviteDialog, org, inviteLink, roles } = inviteParams || {};

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [inviteType, setInviteType] = useState('internal'); // 'internal' or 'external'
  const [emailInput, setEmailInput] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const tabs = [
    { label: t('blocklet.internal'), value: 'internal' },
    { label: t('blocklet.external'), value: 'external' },
  ];

  const emailServiceProvider = useCreation(() => {
    const { settings } = window.blocklet || {};
    return get(settings, 'notification.email.enabled');
  }, []);

  // 防抖搜索文本
  const debouncedSearchText = useDebounce(searchText, { wait: 500 });

  const { data, loadMore, loadingMore } = useInfiniteScroll(
    async (d) => {
      const page = d ? Math.ceil(d.list.length / PAGE_SIZE) + 1 : 1;
      const response = await api.getOrgInvitableUsers({
        input: {
          teamDid,
          id: org.id,
          query: {
            search: debouncedSearchText,
          },
          paging: {
            page,
            pageSize: PAGE_SIZE,
          },
        },
      });
      const { users = [], paging } = response || {};
      return { list: users, total: paging?.total || 0 };
    },
    {
      reloadDeps: [teamDid, debouncedSearchText, org.id],
      isNoMore: (d) => {
        if (!d?.list.length) return true;
        return d.list.length >= d?.total;
      },
      onError: (error) => {
        console.error('Get users failed', error);
      },
    }
  );

  const { list: allUsers = [], total = 0 } = data || {};

  const hasMore = allUsers.length < total;

  // 处理滚动事件
  const handleListboxScroll = useMemoizedFn((event) => {
    const listbox = event.target;
    const { scrollTop, scrollHeight, clientHeight } = listbox;
    // 当滚动到距离底部50px时开始加载
    if (scrollHeight - scrollTop - clientHeight < 50 && !loadingMore && hasMore) {
      loadMore();
    }
  });

  const handleClose = useMemoizedFn(() => {
    setSelectedUsers([]);
    setSelectedRole('');
    setSearchText('');
    setInviteType('internal');
    setEmailInput('');
    setActiveStep(0);
    onTriggerInviteDialog({ open: false });
  });

  const handleInvite = useMemoizedFn(async () => {
    if (inviteType === 'internal' && !selectedUsers.length) {
      Toast.error(t('team.orgs.invite.pleaseSelectUsers'));
      return;
    }
    if (inviteType === 'external' && !emailInput.trim()) {
      Toast.error(t('team.orgs.invite.pleaseEnterEmail'));
      return;
    }
    if (!selectedRole) {
      Toast.error(t('team.orgs.invite.pleaseSelectRole'));
      return;
    }

    try {
      const userDids = inviteType === 'internal' ? selectedUsers.map((user) => user.did) : [];
      const email = inviteType === 'external' ? emailInput.trim() : '';

      await requests.inviteMembers({
        userDids,
        email,
        role: selectedRole,
        inviteType,
      });

      if (inviteType === 'external') {
        setActiveStep(1);
      } else {
        handleClose();
        // onSuccess();
      }
    } catch (error) {
      console.error(error);
      Toast.error(formatError(error));
    } finally {
      setLoading(false);
    }
  });

  const handleRemoveSelectedUser = useMemoizedFn((user) => {
    setSelectedUsers((prev) => prev.filter((u) => u.did !== user.did));
  });

  const handleInviteTypeChange = useMemoizedFn((type) => {
    setInviteType(type);
    if (type === 'external') {
      setSelectedUsers([]);
    } else {
      setEmailInput('');
    }
  });

  const handleCopyInviteLink = useMemoizedFn(() => {
    if (process.env.NODE_ENV === 'e2e' || ['1', 'true'].includes(process.env.IS_E2E)) {
      handleClose();
      return;
    }

    copy(inviteLink);
    Toast.success(t('common.copied'));
    handleClose();
  });

  const steps = [
    {
      title: t('team.orgs.invite.inviteTitle', { orgName: org.name }),
      body: () => {
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* 邀请类型选择 */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Tabs tabs={tabs} currentTab={inviteType} onTabChange={handleInviteTypeChange} loading={loading} />
            </Box>

            {inviteType === 'internal' && (
              <Autocomplete
                multiple
                options={allUsers}
                data-cy="invite-org-select-users"
                loading={loadingMore}
                disabled={loading}
                getOptionLabel={(option) => `${option.fullName || option.name || option.did || ''}`}
                isOptionEqualToValue={(option, value) => option.did === value.did}
                filterOptions={(options) => options}
                value={selectedUsers}
                inputValue={searchText}
                onChange={(_, newValue, reason, details) => {
                  // 支持 toggle 选择：重复点击已选中的选项会取消选中
                  if (reason === 'selectOption') {
                    const clickedUser = details.option;
                    const isAlreadySelected = selectedUsers.some((user) => user.did === clickedUser.did);

                    if (isAlreadySelected) {
                      // 如果已选中，则移除
                      setSelectedUsers((prev) => prev.filter((user) => user.did !== clickedUser.did));
                    } else {
                      // 如果未选中，则添加
                      setSelectedUsers((prev) => [...prev, clickedUser]);
                    }
                    // 选中/取消选中后清空搜索条件
                    setSearchText('');
                  } else {
                    // 其他情况（如删除 chip）保持默认行为
                    setSelectedUsers(newValue);
                  }
                }}
                onInputChange={(_, newInputValue, reason) => {
                  // 只在用户输入时更新搜索文本
                  if (reason === 'input') {
                    setSearchText(newInputValue);
                  } else if (reason === 'clear') {
                    // 点击清空按钮时清空搜索文本
                    setSearchText('');
                  }
                  // reason === 'reset' 时不做处理，保持当前搜索文本
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('common.member')}
                    placeholder={t('team.orgs.invite.chooseUsersToInvite')}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingMore && (
                              <Box sx={{ ml: 1, fontSize: 14, color: 'text.secondary' }}>{t('common.loading')}</Box>
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
                renderValue={(values) => {
                  return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {values.map((value) => (
                        <UserCard
                          key={value.did}
                          did={value.did}
                          avatarSize={20}
                          cardType={CardType.Detailed}
                          infoType={InfoType.Minimal}
                          sx={{ border: 0, padding: 0, minWidth: 150, maxWidth: 150 }}
                          showHoverCard={false}
                          renderTopRightContent={() => {
                            return (
                              <IconButton size="small" onClick={() => handleRemoveSelectedUser(value)}>
                                <CloseIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            );
                          }}
                        />
                      ))}
                    </Box>
                  );
                }}
                slotProps={{
                  listbox: {
                    onScroll: handleListboxScroll,
                    sx: {
                      maxHeight: 300,
                    },
                  },
                  popper: {
                    placement: 'bottom-start',
                    modifiers: [
                      {
                        name: 'flip',
                        enabled: true,
                        options: {
                          altBoundary: true,
                          rootBoundary: 'document',
                          padding: 8,
                        },
                      },
                    ],
                  },
                }}
                renderOption={(props, option, { index }) => {
                  const isSelected = selectedUsers.some((user) => user.did === option.did);
                  const isLast = index === allUsers.length - 1;
                  return (
                    <Box key={option.did}>
                      <Box
                        key={option.did}
                        component="li"
                        {...props}
                        sx={{
                          backgroundColor: isSelected ? 'action.selected' : 'transparent',
                          fontWeight: isSelected ? 600 : 400,
                          '&:hover': {
                            backgroundColor: isSelected ? 'action.selected' : 'action.hover',
                          },
                          position: 'relative',
                        }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Box sx={{ flex: 1 }}>
                            <UserCard
                              avatarSize={32}
                              did={option.did}
                              showDid
                              cardType={CardType.Detailed}
                              infoType={InfoType.Minimal}
                              sx={{ border: 0, padding: 0 }}
                              showHoverCard={false}
                            />
                          </Box>
                          {isSelected && (
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                backgroundColor: 'primary.main',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                ml: 1,
                              }}>
                              ✓
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {/* 加载更多指示器 */}
                      {isLast && hasMore && (
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            py: 1,
                            color: 'text.secondary',
                            fontSize: '0.875rem',
                          }}>
                          {loadingMore ? t('common.loadingMore') : t('common.loadMore')}
                        </Box>
                      )}
                    </Box>
                  );
                }}
              />
            )}

            {/* 外部用户邮箱输入 */}
            {inviteType === 'external' && (
              <TextField
                fullWidth
                type="email"
                label={t('common.email')}
                placeholder={t('team.orgs.invite.enterEmailAddress')}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={loading}
                variant="outlined"
              />
            )}

            <FormControl fullWidth variant="outlined">
              <InputLabel>{t('common.passport')}</InputLabel>
              <Select
                data-cy="invite-org-select-role"
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                }}
                fullWidth
                label={t('common.passport')}
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleInvite();
                  }
                }}>
                {roles.map((r) => (
                  <MenuItem key={r.name} value={r.name} data-cy={`invite-org-select-option-${r.name}`}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="subtitle1">{r.title || r.name}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {r.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );
      },
      onConfirm: handleInvite,
    },
    {
      title: t('team.inviting.link'),
      body: () => {
        return (
          <div>
            <Box
              sx={{
                fontSize: 16,
                fontWeight: 'bold',
              }}>
              {t('team.member.inviteDialog.createSuccessTip', {
                expireDate: formatToDatetime('1760765405325', locale),
              })}
            </Box>
            <div style={{ marginTop: '40px' }} />
            <ClickToCopy>{inviteLink}</ClickToCopy>
            {emailServiceProvider && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1">
                  {t('team.orgs.invite.inviteLinkSendToEmail', { email: emailInput })}
                </Typography>
              </Box>
            )}
          </div>
        );
      },
      confirm: t('common.copy'),
      onConfirm: handleCopyInviteLink,
    },
  ];

  const step = steps[activeStep];
  return (
    <Dialog
      title={step.title || t('common.invite')}
      open={showInvite}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      showCloseButton
      actions={[
        <Button key="cancel" onClick={handleClose} disabled={loading}>
          {t('common.cancel')}
        </Button>,
        <Button
          loading={loading}
          key="invite"
          onClick={step.onConfirm}
          variant="contained"
          disabled={
            (inviteType === 'internal' && !selectedUsers.length) ||
            (inviteType === 'external' && !emailInput.trim()) ||
            loading
          }>
          {step.confirm || t('common.invite')}
        </Button>,
      ]}
      sx={{
        '.MuiDialogContent-root': {
          pt: 0,
        },
      }}>
      <DialogContentText className="dialog-content-body" component="div">
        {typeof step.body === 'function' ? step.body() : step.body}
      </DialogContentText>
    </Dialog>
  );
}
