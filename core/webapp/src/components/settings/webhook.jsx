/* eslint-disable react/no-unstable-nested-components */
import { useContext, useState } from 'react';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import styled from '@emotion/styled';
import Toast from '@arcblock/ux/lib/Toast';

import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Spinner from '@mui/material/CircularProgress';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';

import Datatable from '@arcblock/ux/lib/Datatable';
import LinkIcon from '@mui/icons-material/Link';
import TextField from '@mui/material/TextField';
import SendIcon from '@mui/icons-material/Send';
import Actions from '@abtnode/ux/lib/actions';
import SwitchWithLabel from '@abtnode/ux/lib/switch';
import { formatError, checkInputByType } from '../../libs/util';

import { useNodeContext } from '../../contexts/node';
import Confirm from '../confirm';

import DelButton from '../webhook/delete';

export default function HookSetting() {
  const { api, imgPrefix } = useNodeContext();
  const { t, locale } = useContext(LocaleContext);

  const [defaultConfig, setDefaultConfig] = useState([]);
  const [confirmSetting, setConfirmSetting] = useState(null);

  const state = useAsyncRetry(async () => {
    const [{ webhooks }, { senders }] = await Promise.all([api.getWebHooks(), api.getWebhookSenders()]);

    setDefaultConfig(senders);
    return webhooks;
  });
  const list = state.value || [];
  const { loading, error } = state;
  const existUrls = new Set(list.map(item => item.params.map(param => param.value)).flat());

  const onConfirm = async data => {
    try {
      await api.createWebHook({ input: data });
      state.retry();
    } catch (err) {
      Toast.error(formatError(err), { autoHideDuration: 4000 });
      console.error('create webhook error', err);
    }
    setConfirmSetting(null);
  };

  const onCancel = () => {
    setConfirmSetting(null);
  };

  const onSetWebHook = x => {
    const setting = {
      title: x.title,
      description: (params, setParams, setError) => {
        const setValue = data => {
          setParams({
            list: data,
            __disableConfirm: data.some(item => item.disable),
          });
        };

        const inputList = params.list || [];
        return (
          <Main>
            {inputList.map((item, index) => (
              <Form key={item.name}>
                <TextField
                  label={item.description}
                  autoComplete="off"
                  variant="outlined"
                  fullWidth
                  autoFocus
                  style={{ marginBottom: 16 }}
                  margin="dense"
                  value={item.value || item.defaultValue}
                  onChange={e => {
                    if (item.required) {
                      item.disable = true;
                    }

                    const trimValue = e.target.value.trim();
                    item.value = trimValue;
                    inputList[index] = item;

                    if (trimValue) {
                      const isDuplicate = existUrls.has(trimValue);
                      if (checkInputByType(item.type, trimValue) && !isDuplicate) {
                        item.disable = false;
                        setError('');
                      } else {
                        item.disable = true;

                        setError(
                          isDuplicate
                            ? t('setting.webhook.duplicateError')
                            : t('setting.webhook.requiredError', {
                                type: item.description,
                              })
                        );
                      }
                    } else {
                      if (item.required) {
                        item.disable = true;
                      }
                      setError('');
                    }

                    setValue([...inputList]);
                  }}
                  slotProps={{
                    htmlInput: {
                      'data-cy': 'webhook-input',
                    },
                  }}
                />
              </Form>
            ))}
          </Main>
        );
      },
      params: {
        list: x.params,
        __disableConfirm: true,
      },
      confirm: t('setting.webhook.add'),
      cancel: t('common.cancel'),
      onConfirm: data => {
        x.params = data.list;
        onConfirm(x);
      },
      onCancel,
    };

    setConfirmSetting(setting);
  };

  const webhookIcon = d => {
    const isSlack = d.type === 'slack';
    return isSlack ? (
      <img src={`${imgPrefix}/${d.type}.png`} alt="icon" style={{ width: 20, height: 20 }} />
    ) : (
      <LinkIcon />
    );
  };

  const onSendTestNotification = async rowInfo => {
    try {
      const params = {
        webhookId: rowInfo.id,
        message: 'This is a test notification in order to test the integration',
      };
      await api.sendTestMessage({
        input: params,
      });
      Toast.success(t('setting.webhook.testSuccess'));
    } catch (err) {
      Toast.error(formatError(err), { autoHideDuration: 4000 });
      console.error('send test notification error', err);
    }
  };

  const onToggleEnabled = async (webhook, url, checked) => {
    try {
      await api.updateWebHookState({ input: { id: webhook.id, url, enabled: checked } });
      Toast.success(t('setting.webhook.updateSuccess'));
      state.retry();
    } catch (err) {
      console.error('update webhook enabled error', err);
      Toast.error(formatError(err), { autoHideDuration: 4000 });
    }
  };

  const columns = [
    {
      label: t('setting.webhook.columns.description'),
      name: 'id',
      verticalKeyAlign: 'center',
      options: {
        sort: false,
        customBodyRenderLite: rawIndex => {
          const d = list[rawIndex];

          const desc = defaultConfig.find(item => item.name === d.name);
          return (
            <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
              {webhookIcon(d)}
              <div style={{ marginLeft: 10 }}>
                <b>
                  {'ID: '}
                  {d.id}
                </b>
                <div>{desc ? desc.description : null}</div>
              </div>
            </div>
          );
        },
      },
    },
    {
      label: t('setting.webhook.columns.params'),
      name: 'params',
      options: {
        sort: false,
        customBodyRenderLite: rawIndex => {
          const d = list[rawIndex];
          const params = d.params.map(item => {
            const isEnabled = item?.enabled ?? true;
            return (
              <Box key={item.value} sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, width: '100%' }}>
                <Box sx={{ flexShrink: 0 }}>
                  <SwitchWithLabel checked={isEnabled} onChange={checked => onToggleEnabled(d, item.value, checked)} />
                </Box>
                <Typography
                  variant="body2"
                  component="div"
                  title={item.value}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                  {item.value}
                </Typography>
              </Box>
            );
          });
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, width: '100%' }}>{params}</Box>
          );
        },
      },
    },
    {
      label: t('setting.webhook.columns.createdAt'),
      name: 'createdAt',
      options: {
        customBodyRenderLite: rawIndex => {
          const d = list[rawIndex];
          return <RelativeTime value={d.createdAt} locale={locale} />;
        },
      },
    },
    {
      label: t('common.actions'),
      align: 'center',
      verticalKeyAlign: 'center',
      options: {
        sort: false,
        customBodyRenderLite: rawIndex => {
          const d = list[rawIndex];

          const info = defaultConfig.find(item => item.name === d.name) || {};
          return (
            <Actions
              actions={[
                {
                  render: ({ close }) => (
                    <DelButton
                      item={{ ...d, title: info.title }}
                      close={close}
                      onDelete={() => {
                        state.retry();
                      }}
                    />
                  ),
                },
                {
                  icon: <SendIconInfo />,
                  text: t('setting.webhook.test'),
                  onClick: () => {
                    onSendTestNotification(d);
                  },
                },
              ]}
            />
          );
        },
      },
    },
  ];

  if (!list.length && loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <Spinner />
      </div>
    );
  }
  if (!list.length && error) {
    return <Alert severity="error">{formatError(error)}</Alert>;
  }

  const customButtons = defaultConfig.map(x => {
    return {
      icon: webhookIcon(x),
      title: `${t('common.add')} ${x.title}`,
      onClick: () => {
        onSetWebHook(x);
      },
    };
  });

  return (
    <Main>
      {confirmSetting && (
        <Confirm
          color="primary"
          title={confirmSetting.title}
          description={confirmSetting.description}
          confirm={confirmSetting.confirm}
          params={confirmSetting.params}
          onConfirm={confirmSetting.onConfirm}
          onCancel={confirmSetting.onCancel}
        />
      )}
      <Datatable
        columns={columns}
        data={list}
        locale={locale}
        customButtons={customButtons}
        verticalKeyWidth={100}
        options={{
          download: false,
          filter: false,
          print: false,
        }}
      />
    </Main>
  );
}

const Main = styled.div`
  .button-addon {
    text-align: right;
  }

  .add-list {
    width: 420px;
    max-width: calc(100vw - 10px);
    text-align: left;
    background: #fff;
    border-radius: 5px;
  }
`;

const Form = styled.div`
  display: flex;
`;

const SendIconInfo = styled(SendIcon)`
  font-size: 16px !important;
  margin-right: 3px;
`;
