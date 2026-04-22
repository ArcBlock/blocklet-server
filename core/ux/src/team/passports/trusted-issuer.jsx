/* eslint-disable react/no-array-index-key */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import cloneDeep from 'lodash/cloneDeep';

import Dialog from '@arcblock/ux/lib/Dialog';
import Spinner from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import DeleteIcon from '@arcblock/icons/lib/DeleteIcon';
import Empty from '@arcblock/ux/lib/Empty';

import { ROLES } from '@abtnode/constant';
import Toast from '@arcblock/ux/lib/Toast';

import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import { sleep, formatError } from '../../util';
import LongArrow from '../../icons/long-arrow.svg?react';

const canSave = (issuerDid, mappings) => {
  if (!issuerDid) {
    return false;
  }

  return !mappings.some((x) => !x.from.passport || !x.to.role);
};

export default function TrustedIssuer({ onCancel, onSuccess, data = {}, trustedPassports = [] }) {
  const { api } = useNodeContext();
  const { roles, teamDid } = useTeamContext();
  const { t } = useLocaleContext();
  const [loading, setLoading] = useState(false);
  const [issuerDid, setIssuerDid] = useState(data.issuerDid || '');
  const [remark, setRemark] = useState(data.remark || '');
  const [mappings, setMappings] = useState(cloneDeep(data.mappings) || []);

  const editIndex = trustedPassports.findIndex((x) => x.issuerDid === data.issuerDid);

  const configTrustedPassports = async () => {
    if (loading) {
      return;
    }

    const item = {
      issuerDid,
      remark,
      mappings: mappings.map((x) => ({
        ...x,
        to: { ...x.to, ttl: x.to.ttl || 0 },
      })),
    };

    const trustedList = [...trustedPassports];

    if (editIndex === -1) {
      trustedList.unshift(item);
    } else {
      trustedList[editIndex] = item;
    }

    try {
      setLoading(true);
      await api.configTrustedPassports({ input: { teamDid, trustedPassports: trustedList } });
      await sleep(800);
      setLoading(false);
      Toast.success(t('common.saveSuccess'));
      onSuccess();
    } catch (err) {
      setLoading(false);
      Toast.error(formatError(err));
    }
  };

  return (
    <Dialog
      title={t('team.passport.trustedIssuers')}
      open
      showCloseButton={false}
      PaperProps={{ style: { minHeight: '80vh' } }}
      fullWidth
      prepend={
        <IconButton onClick={onCancel} data-cy="trusted-issuer-close" size="large">
          <ArrowBackIcon />
        </IconButton>
      }
      actions={
        <>
          <Button onClick={onCancel} color="inherit">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => configTrustedPassports()}
            color="primary"
            disabled={!canSave(issuerDid, mappings) || !remark || loading}
            variant="contained"
            autoFocus
            data-cy="save-mapping">
            {loading && <Spinner size={16} />}
            {t('common.save')}
          </Button>
        </>
      }>
      <Div>
        <div className="dialog-content">
          <TextField
            fullWidth
            data-cy="input-issuer-did"
            placeholder={t('team.passport.issuerDid')}
            value={issuerDid}
            onChange={(event) => {
              setIssuerDid(event.target.value);
            }}
          />

          <TextField
            style={{ marginTop: 16 }}
            fullWidth
            data-cy="input-issuer-remark"
            placeholder={t('common.remark')}
            value={remark}
            onChange={(event) => {
              setRemark(event.target.value);
            }}
          />

          <Box
            sx={{
              mt: '30px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Box className="dialog-h1">{t('team.passport.mappingRule')}</Box>
            <Box>
              <Button
                variant="outlined"
                color="primary"
                data-cy="add-mapping"
                onClick={() => {
                  setMappings((d) => {
                    const res = [...d];
                    res.unshift({ from: { passport: '' }, to: { role: ROLES.GUEST } });
                    return res;
                  });
                }}>
                {t('team.add')}
              </Button>
            </Box>
          </Box>

          <Box
            className="list"
            sx={{
              mt: -0.5,
            }}>
            {mappings.map((item, index) => (
              <Box
                key={`mapping-${index}`}
                className="mapping-item"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  my: 1,
                }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexGrow: 1,
                  }}>
                  <Box
                    sx={{
                      flexGrow: 1,
                      flexBasis: 1,
                    }}>
                    <TextField
                      fullWidth
                      size="small"
                      data-cy={`input-${index}-from`}
                      placeholder="Issuer’s Passport Name/ID *"
                      value={item.from.passport}
                      onChange={(event) => {
                        const { value } = event.target;
                        setMappings((d) => {
                          const res = [...d];
                          res[index].from.passport = value;
                          return res;
                        });
                      }}
                      sx={{
                        '& .MuiInputBase-input::placeholder': {
                          fontSize: 14,
                        },
                        '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      flexShrink: 0,
                      mx: 1,
                      width: 65,
                      height: 16,
                    }}>
                    <LongArrow />
                  </Box>

                  {/* role */}
                  <Box
                    sx={{
                      flexGrow: 1,
                      flexBasis: 1,
                    }}>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      value={item.to.role}
                      onChange={(e) => {
                        setMappings((d) => {
                          const res = [...d];
                          res[index].to.role = e.target.value;
                          return res;
                        });
                      }}
                      variant="outlined">
                      {roles
                        .filter((d) => d.name !== 'owner')
                        .map((r) => (
                          <MenuItem key={r.name} value={r.name} data-cy={`passport-mapping-select-option-${r.name}`}>
                            <span>{r.title || r.name}</span>
                          </MenuItem>
                        ))}
                    </TextField>
                  </Box>
                </Box>

                {/* delete */}
                <Box
                  sx={{
                    flexShrink: 0,
                  }}>
                  <IconButton
                    onClick={() => {
                      setMappings((d) => {
                        const res = [...d];
                        res.splice(index, 1);
                        return res;
                      });
                    }}
                    size="large">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            ))}

            {!mappings.length && (
              <Box
                sx={{
                  my: 2,
                  color: 'text.secondary',
                  fontSize: '16px',
                }}>
                <Empty>{t('common.empty')}</Empty>
              </Box>
            )}
          </Box>
        </div>
      </Div>
    </Dialog>
  );
}

TrustedIssuer.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  trustedPassports: PropTypes.array,
  data: PropTypes.object,
};

const Div = styled.div`
  .dialog-h1 {
    font-size: 18px;
  }

  .list {
    .MuiIconButton-root {
      svg {
        fill: #bfbfbf;
      }
    }
  }
`;
