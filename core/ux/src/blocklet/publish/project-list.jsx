/* eslint-disable react/no-unstable-nested-components */
import PropTypes from 'prop-types';
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { toAddress } from '@arcblock/did';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import AddIcon from '@mui/icons-material/Add';
import NewFileIcon from '@mui/icons-material/AddBox';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorIcon from '@mui/icons-material/Error';
import VisibilityIcon from '@mui/icons-material/FileOpen';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import { UNOWNED_DID, WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import Button from '@arcblock/ux/lib/Button';
import Datatable, { getDurableData } from '@arcblock/ux/lib/Datatable';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';
import Tag from '@arcblock/ux/lib/Tag';
import Toast from '@arcblock/ux/lib/Toast';

import { styled, Tooltip, Typography, useMediaQuery } from '@mui/material';
import TableSearch from '@arcblock/ux/lib/Datatable/TableSearch';
import Confirm from '../../confirm';
import { useBlockletContext } from '../../contexts/blocklet';
import { useNodeContext } from '../../contexts/node';
import { useSessionContext } from '../../contexts/session';
import DidAddress from '../../did-address';
import EmptySpinner from '../../empty-spinner';
import BlockletBundleAvatar from '../bundle-avatar';
import ShortenLabel from '../component/shorten-label';
import BlockletCard from './blocklet-card';
import ListHeader from '../../list-header';

export default function ProjectList({ initUrl = null }) {
  const navigate = useNavigate();
  const tenantScope = initUrl?.searchParams.get('tenantScope') || '';
  const { t, locale } = useLocaleContext();
  const { api } = useNodeContext();
  const { api: sessionApi } = useSessionContext();
  const [loading, setLoading] = useState(true);
  const { blocklet } = useBlockletContext();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [openDidConnect, setOpenDidConnect] = useState(false);
  const smallScreen = useMediaQuery((theme) => theme.breakpoints.down('xl'));
  const isMobile = useMediaQuery((x) => x.breakpoints.down('md'));

  const { componentDid = '' } = useParams();
  const [projects, setProjects] = useState(null);

  const durableKey = `publish-${blocklet.meta.did}`;
  const tableDurableData = getDurableData(durableKey);
  const [search, setSearch] = useState({
    searchText: tableDurableData.searchText || '',
    pageSize: tableDurableData.rowsPerPage || 10,
    page: 1,
  });

  const getProjects = () => {
    api
      .getProjects({ input: { did: blocklet.meta.did, componentDid, tenantScope } })
      .then((res) => {
        const list = res?.projects || [];
        setLoading(false);

        setProjects(list);
      })
      .catch((err) => {
        setLoading(false);
        Toast.error(err.message);
      });
  };

  const handleNewBlocklet = () => {
    navigate(`${UNOWNED_DID}/create/none/0.0.0`, { replace: true });
  };

  const onDeleteProject = (project) => {
    setDeleteConfirm(project);
  };

  const confirmDeleteProject = () => {
    setLoading(false);
    setOpenDidConnect(true);
  };

  const handleDidConnectClose = () => {
    setOpenDidConnect(false);
    setDeleteConfirm(null);
  };

  const handleDidConnectDidError = (err) => {
    Toast.error(err.message);
    setOpenDidConnect(false);
    setDeleteConfirm(null);
  };

  const handleDidConnectDidSuccess = (result) => {
    if (!result?.deleted) {
      Toast.error('Delete project failed');
      return;
    }
    getProjects();
    setOpenDidConnect(false);
    setDeleteConfirm(null);
  };

  useEffect(() => {
    getProjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredProjects = useMemo(() => {
    if (!search.searchText) {
      return projects;
    }

    let key = search.searchText?.trim();
    if (!key) {
      return projects;
    }
    key = toAddress(key).toLocaleLowerCase();

    return projects.filter((project) => {
      return project.blockletTitle.toLowerCase().includes(key) || project.blockletDid.toLowerCase().includes(key);
    });
  }, [projects, search.searchText]);

  if (!projects && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '40px' }}>
        <EmptySpinner />
      </Box>
    );
  }

  if (!projects) {
    return null;
  }

  if (!projects.length) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 10,
        }}>
        <Box sx={{ fontSize: 20, fontWeight: 'bold', mb: 3 }}>{t('blocklet.publish.blockletEmptyTip')}</Box>
        <Box sx={{ fontSize: 14, color: 'text.secondary', mb: 3 }}>{t('blocklet.publish.createBlockletTip')}</Box>
        <Button onClick={handleNewBlocklet} variant="contained">
          {t('blocklet.publish.createBlocklet')}
        </Button>
      </Box>
    );
  }

  const columns = [
    {
      label: 'Blocklet',
      name: 'blockletTitle',
      minWidth: 160,
      options: {
        customBodyRenderLite: (rawIndex) => {
          const project = projects[rawIndex];
          return (
            <Link to={`${project.id}`}>
              <BlockletCard
                did={blocklet.meta.did}
                projectId={project.id}
                logo={project.blockletLogo}
                title={project.blockletTitle}
                describe={project.blockletDescription}
              />
            </Link>
          );
        },
      },
    },
    {
      label: 'Version',
      name: 'blockletVersion',
      options: {
        searchable: false,
        customBodyRender: (value) => {
          return value ? <Tag type="success">{value}</Tag> : '';
        },
      },
    },
    {
      label: 'DID',
      name: 'blockletDid',
      options: {
        customBodyRender: (did) => {
          if (!did) {
            return null;
          }
          return <DidAddress size={14} compact responsive={false} did={did} />;
        },
      },
    },
    smallScreen || componentDid
      ? null
      : {
          label: t('common.createdBy'),
          name: 'createdBy',
          options: {
            customBodyRender: (did) => {
              if (!did) {
                return null;
              }
              return (
                <DidAddress
                  onClick={() => {
                    navigate(`${WELLKNOWN_SERVICE_PATH_PREFIX}/admin/members?did=${did}`);
                  }}
                  style={{ cursor: 'pointer' }}
                  size={14}
                  compact
                  copyable={false}
                  showQrcode={false}
                  responsive={false}
                  did={did}
                />
              );
            },
          },
        },
    smallScreen || componentDid
      ? null
      : {
          label: t('common.scope'),
          name: 'componentDid',
          options: {
            customBodyRender: (value) => {
              const component = (blocklet.children || []).find((x) => x.meta.did === value);
              if (!component) {
                return '';
              }
              return (
                <Box
                  key={value}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}>
                  <BlockletBundleAvatar size={14} blocklet={component} ancestors={[blocklet]} />
                  <Box
                    sx={{
                      ml: 0.5,
                      color: 'text.primary',
                      fontSize: 14,
                    }}>
                    {component.meta.title}
                  </Box>
                </Box>
              );
            },
          },
        },
    smallScreen || tenantScope
      ? null
      : {
          label: t('blocklet.publish.tenantScope'),
          name: 'tenantScope',
          options: {
            customBodyRender: (value) => {
              return (
                <Box
                  sx={{
                    ml: 0.5,
                    color: 'text.primary',
                    fontSize: 14,
                  }}>
                  <ShortenLabel>{value}</ShortenLabel>
                </Box>
              );
            },
          },
        },
    {
      label: t('common.updatedAt'),
      name: 'updatedAt',
      options: {
        searchable: false,
        customBodyRender: (value) => {
          return <RelativeTime value={Number(value)} locale={locale} />;
        },
      },
    },
    {
      label: t('common.actions'),
      name: 'actions',
      options: {
        searchable: false,
        customBodyRenderLite: (rawIndex) => {
          const project = projects[rawIndex];

          return (
            <Box
              sx={{
                display: 'flex',
              }}>
              <Link to={`${project.id}/new-release/none/${project.lastReleaseId}`}>
                <Tooltip title={t('blocklet.publish.createRelease')} placement="top">
                  <IconButton color="primary" aria-label="create">
                    <NewFileIcon style={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Link>
              {!!project.lastReleaseId && (
                <Tooltip title={t('blocklet.publish.viewLastRelease', { name: project.blockletTitle })} placement="top">
                  <IconButton color="secondary" aria-label="create">
                    <Link
                      style={{ display: 'flex' }}
                      to={`${project.id}/view/${project.lastReleaseId}/${project.blockletVersion}`}>
                      <VisibilityIcon sx={{ fontSize: 18 }} />
                    </Link>
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title={t('blocklet.publish.delete', { name: project.blockletTitle })} placement="top">
                <IconButton color="primary" aria-label="delete" onClick={() => onDeleteProject(project)}>
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    },
  ].filter(Boolean);

  const onTableChange = ({ page, rowsPerPage, searchText }) => {
    if (search.pageSize !== rowsPerPage) {
      setSearch((x) => ({ ...x, searchText: '', pageSize: rowsPerPage, page: 1 }));
    } else if (search.page !== page + 1) {
      setSearch((x) => ({ ...x, searchText: '', page: page + 1 }));
    } else if (search.searchText !== searchText) {
      setSearch((x) => ({ ...x, searchText, page: 1 }));
    }
  };

  const didConnect = openDidConnect ? (
    <DidConnect
      open
      popup
      onClose={handleDidConnectClose}
      action="check-has-project-id"
      locale={locale}
      checkFn={sessionApi.get}
      saveConnect={false}
      forceConnected={false}
      checkTimeout={5 * 60 * 1000}
      onSuccess={handleDidConnectDidSuccess}
      onError={handleDidConnectDidError}
      extraParams={{
        projectId: deleteConfirm.id,
        did: blocklet.meta.did,
        name: deleteConfirm.blockletTitle,
      }}
      messages={{
        title: t('blocklet.publish.deleteProject.title', { name: deleteConfirm.blockletTitle }),
        scan: t('blocklet.publish.deleteProject.scan', { name: deleteConfirm.blockletTitle }),
        confirm: t('blocklet.publish.deleteProject.confirm'),
        success: t('blocklet.publish.deleteProject.success'),
      }}
    />
  ) : null;

  return (
    <Wrapper>
      <ListHeader
        sx={{ mb: 2 }}
        left={
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Typography variant="h4">
              {t('common.blocklets')} ({filteredProjects.length})
            </Typography>
            <Tooltip title={t('blocklet.publish.createBlockletTip')} arrow placement="right">
              <HelpOutlineOutlinedIcon sx={{ opacity: 0.6, fontSize: '1.1em', ml: 1 }} />
            </Tooltip>
          </Box>
        }
        actions={
          <>
            <TableSearch
              options={{
                searchPlaceholder: t('blocklet.list.searchPlaceholder'),
                searchDebounceTime: 600,
                searchAlwaysOpen: isMobile,
              }}
              search={search.searchText}
              searchText={search.searchText}
              searchTextUpdate={(value) => setSearch((x) => ({ ...x, searchText: value }))}
              searchClose={() => setSearch((x) => ({ ...x, searchText: '' }))}
              onSearchOpen={() => {}}
            />

            <Button onClick={handleNewBlocklet} variant="contained">
              <AddIcon style={{ fontSize: '1.3em', marginRight: 4 }} />
              {t('blocklet.publish.createBlocklet')}
            </Button>
          </>
        }
      />
      <Datatable
        className="main-table"
        locale={locale}
        data={filteredProjects}
        columns={columns}
        options={{
          search: false,
          sort: false,
          download: false,
          filter: false,
          print: false,
          viewColumns: false,
          searchAlwaysOpen: true,
          rowsPerPageOptions: [10, 20, 50, 100],
        }}
        durable={durableKey}
        onChange={onTableChange}
      />
      {deleteConfirm && (
        <Confirm
          title={`${t('common.delete')} ${deleteConfirm.blockletTitle}`}
          description={t('blocklet.publish.deleteProject.description')}
          confirm={t('common.confirm')}
          onConfirm={confirmDeleteProject}
          onCancel={() => setDeleteConfirm(null)}>
          <Box sx={{ marginTop: 2 }}>
            {[
              t('blocklet.publish.deleteProject.tip1'),
              t('blocklet.publish.deleteProject.tip2'),
              t('blocklet.publish.deleteProject.tip3'),
            ].map((x) => (
              <Box sx={{ display: 'flex', marginTop: 1, flexDirection: 'row', alignItems: 'flex-start' }}>
                <ErrorIcon color="warning" sx={{ marginRight: 1, fontSize: 20, marginTop: '2px' }} />
                <Typography
                  component="span"
                  variant="inherit"
                  sx={{
                    color: 'text.secondary',
                  }}>
                  {x}
                </Typography>
              </Box>
            ))}
          </Box>
        </Confirm>
      )}
      {didConnect}
    </Wrapper>
  );
}

const Wrapper = styled(Box)`
  ${({ theme }) => theme.breakpoints.down('md')} {
    .MuiTableRow-root {
      border-color: ${({ theme }) => theme.palette.divider};
    }
  }
`;

ProjectList.propTypes = {
  initUrl: PropTypes.object,
};
