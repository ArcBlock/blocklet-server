/* eslint-disable no-shadow */
import { UNOWNED_DID } from '@abtnode/constant';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast/index';
import styled from '@emotion/styled';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Avatar, Box, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import React, { Suspense, lazy, useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';

import { useNodeContext } from '../../../contexts/node';
import EmptySpinner from '../../../empty-spinner';
import usePromiseWindowOpen from '../../../hooks/use-promise-window-open';
import { formatError } from '../../../util';
import useWantToConnectStore from '../hooks/use-want-to-connect-store';
import { createMessageId, waitGetConnectedByStudio } from '../utils/wait-connect';
import ConnectStoreButton from './connect-store-button';
import getSourceUrls from './tool';
import VideoDialog from './video-dialog';
import VideoEmbed from './video-embed';
import Warning from './warning';

// eslint-disable-next-line import/no-unresolved
const UploaderComponent = lazy(() => import('@blocklet/uploader').then((res) => ({ default: res.Uploader })));

function Branding({
  projectId,
  readOnly,
  loading,
  blocklet,
  params,
  setParams,
  paramsErrTip,
  setParamsErrTip,
  warning,
  setLoading,
  initUrl = null,
  initLogoUrl,
  setInitLogoUrl,
  componentDid = '',
}) {
  const { t, locale } = useLocaleContext();
  const { api } = useNodeContext();
  const navigate = useNavigate();
  const uploaderLogoRef = useRef(null);
  const uploaderScreenshotRef = useRef(null);
  const [wantToConnectStore, setWantToConnectStore] = useWantToConnectStore(blocklet);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const openWindow = usePromiseWindowOpen({
    messageType: 'connect-store-message',
    onOpen: () => setLoading(true),
    onClose: () => setLoading(false),
  });

  const onOpenConnectByStudio = async (param) => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 20000);
    const nextBlockletDid = await waitGetConnectedByStudio(api, param);
    setLoading(false);
    clearTimeout(timer);
    window.parent.postMessage({ event: 'studioDialog.connected', componentDid }, '*');
    navigate(window.location.pathname.replace(`${UNOWNED_DID}/create`, `${nextBlockletDid}/create`), {
      replace: true,
    });
  };

  const handleConnectByStudio = () => {
    if (!params.blockletTitle) {
      Toast.error(t('blocklet.publish.errorTip.noTitle'));
      return;
    }

    if (!wantToConnectStore?.url) {
      Toast.error(t('blocklet.publish.noStoreSelected'));
      return;
    }

    const messageId = createMessageId();
    openWindow(async (_, open) => {
      try {
        const res = await api.connectByStudio({
          input: {
            did: blocklet?.meta?.did,
            blockletTitle: params?.blockletTitle,
            storeUrl: wantToConnectStore.url,
            storeId: wantToConnectStore.id,
            storeName: wantToConnectStore.name,
            type: params?.blockletComponents?.length > 0 ? 'pack' : 'resource',
            componentDid,
            messageId,
            tenantScope: initUrl?.searchParams.get('tenantScope') || '',
          },
        });
        if (!res?.url) {
          Toast.error('failed to connect to store');
          return;
        }
        open(res.url);
        onOpenConnectByStudio({ did: blocklet?.meta?.did, projectId: '', messageId });
      } catch (err) {
        const error = formatError(err);
        Toast.error(error);
        setLoading(false);
      }
    });
  };

  const { logoUrl, screenshotUrls, uploadLogoPrefix, uploadScreenshotPrefix } = getSourceUrls(
    params,
    blocklet,
    projectId
  );
  const { logoErrors, screenshotErrors, storeList, hasLogoWarning, hasScreenshotWarning } = warning;
  const checkCanUpload = () => {
    if (readOnly) {
      return false;
    }
    if (!projectId || projectId === UNOWNED_DID) {
      Toast.error(t('blocklet.publish.errorTip.noFirstDid'));
      return false;
    }
    return true;
  };

  const onDragScreenshotsEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(params.blockletScreenshots);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setParams((prev) => ({
      ...prev,
      blockletScreenshots: items,
    }));
  };

  const onDragVideosEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(params.blockletVideos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setParams((prev) => ({
      ...prev,
      blockletVideos: items,
    }));
  };

  return (
    <Content>
      <Box
        className="section"
        sx={{
          display: 'flex',
        }}>
        <Box sx={{ flex: 1 }}>
          <TextField
            disabled={loading || readOnly}
            label={`Blocklet ${t('common.title')}`}
            placeholder={`Blocklet ${t('common.title')}`}
            autoComplete="off"
            variant="outlined"
            fullWidth
            required
            value={params.blockletTitle || ''}
            onChange={(e) => {
              setParamsErrTip({ blockletTitle: '' });
              setParams({ blockletTitle: e.target.value });
            }}
            error={!!paramsErrTip.blockletTitle}
            helperText={paramsErrTip.blockletTitle || ''}
            slotProps={{
              input: {
                'data-cy': 'blocklet-title',
                readOnly,
              },
            }}
          />
          <TextField
            required
            label="Blocklet DID"
            fullWidth
            readonly
            disabled
            autoComplete="off"
            variant="outlined"
            error={!!paramsErrTip.projectId}
            helperText={paramsErrTip.projectId || ''}
            value={projectId === UNOWNED_DID ? '' : `did:abt:${projectId}`}
            sx={{ mt: 3 }}
            slotProps={{
              input: {
                'data-cy': 'export-blocklet-did',
                endAdornment: projectId === UNOWNED_DID && (
                  <InputAdornment position="end">
                    <ConnectStoreButton
                      blocklet={blocklet}
                      store={wantToConnectStore}
                      componentDid={componentDid}
                      onChangeStore={setWantToConnectStore}
                      disabled={!params.blockletTitle || readOnly || loading}
                      loading={loading}
                      onClick={handleConnectByStudio}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            disabled={loading || readOnly}
            label={`Blocklet ${t('common.description')}`}
            placeholder={`Blocklet ${t('common.description')}`}
            required
            autoComplete="off"
            variant="outlined"
            fullWidth
            value={params.blockletDescription || ''}
            onChange={(e) => {
              setParamsErrTip({ blockletDescription: '' });
              setParams({ blockletDescription: e.target.value.slice(0, 159) });
            }}
            error={!!paramsErrTip.blockletDescription}
            helperText={paramsErrTip.blockletDescription || ''}
            sx={{ mt: 3 }}
            slotProps={{
              input: {
                'data-cy': 'blocklet-description',
                readOnly,
              },
            }}
          />
          <TextField
            disabled={loading || readOnly}
            label={`Blocklet ${t('common.homepageTip')}`}
            placeholder={`Blocklet ${t('common.homepageTip')}`}
            autoComplete="off"
            variant="outlined"
            fullWidth
            value={params.blockletHomepage || ''}
            onChange={(e) => {
              if (e.target.value && !/^(http|https):\/\//.test(e.target.value)) {
                setParamsErrTip({ blockletHomepage: t('blocklet.publish.errorTip.invalidUrl') });
              } else {
                setParamsErrTip({ blockletHomepage: '' });
              }
              setParams({ blockletHomepage: e.target.value });
            }}
            error={!!paramsErrTip.blockletHomepage}
            helperText={paramsErrTip.blockletHomepage || ''}
            sx={{ mt: 3 }}
            slotProps={{
              input: {
                'data-cy': 'blocklet-homepage',
                readOnly,
              },
            }}
          />
          <TextField
            disabled={loading || readOnly}
            label={`Blocklet ${t('common.community')}`}
            placeholder={`Blocklet ${t('common.community')}`}
            autoComplete="off"
            variant="outlined"
            fullWidth
            value={params.blockletCommunity || ''}
            onChange={(e) => {
              if (e.target.value && !/^(http|https):\/\//.test(e.target.value)) {
                setParamsErrTip({ blockletCommunity: t('blocklet.publish.errorTip.invalidUrl') });
              } else {
                setParamsErrTip({ blockletCommunity: '' });
              }
              setParams({ blockletCommunity: e.target.value });
            }}
            error={!!paramsErrTip.blockletCommunity}
            helperText={paramsErrTip.blockletCommunity || ''}
            sx={{ mt: 3 }}
            slotProps={{
              input: {
                'data-cy': 'blocklet-community',
                readOnly,
              },
            }}
          />
          <TextField
            disabled={loading || readOnly}
            label={`Blocklet ${t('common.support')}`}
            placeholder={`Blocklet ${t('common.support')}`}
            autoComplete="off"
            variant="outlined"
            fullWidth
            value={params.blockletSupport || ''}
            onChange={(e) => {
              if (
                e.target.value &&
                !/^(http|https):\/\//.test(e.target.value) &&
                !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e.target.value)
              ) {
                setParamsErrTip({ blockletSupport: t('blocklet.publish.errorTip.invalidUrlOrEmail') });
              } else {
                setParamsErrTip({ blockletSupport: '' });
              }
              setParams({ blockletSupport: e.target.value });
            }}
            error={!!paramsErrTip.blockletSupport}
            helperText={paramsErrTip.blockletSupport || ''}
            sx={{ mt: 3 }}
            slotProps={{
              input: {
                'data-cy': 'blocklet-support',
                readOnly,
              },
            }}
          />
          <TextField
            disabled={loading || readOnly}
            label={`Blocklet ${t('common.repository')}`}
            placeholder={`Blocklet ${t('common.repository')}`}
            autoComplete="off"
            variant="outlined"
            fullWidth
            value={params.blockletRepository || ''}
            onChange={(e) => {
              if (e.target.value && !/^(git|https|svn)/.test(e.target.value)) {
                setParamsErrTip({ blockletRepository: t('blocklet.publish.errorTip.invalidUrl') });
              } else {
                setParamsErrTip({ blockletRepository: '' });
              }
              setParams({ blockletRepository: e.target.value });
            }}
            error={!!paramsErrTip.blockletRepository}
            helperText={paramsErrTip.blockletRepository || ''}
            sx={{ mt: 3 }}
            slotProps={{
              input: {
                'data-cy': 'blocklet-repository',
                readOnly,
              },
            }}
          />
        </Box>
      </Box>
      <Box
        className="section full-width"
        sx={{
          display: 'flex',
          mt: 3,
        }}>
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
          }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}>
            <Stack direction="column" spacing={1} sx={{ mr: 2, width: '160px' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {t('common.logo')}
              </Typography>
              <Stack
                direction="column"
                spacing={1}
                sx={{
                  alignItems: 'flex-start',
                  opacity: 0.8,
                  fontSize: '12px',
                }}>
                <Box>
                  <Box component="span">
                    <Box component="span" sx={{ color: 'text.secondary' }}>
                      {t('studio.type')}:{' '}
                    </Box>
                    <Box component="span" sx={{ color: 'secondary.main' }}>
                      png, jpg, webp, svg
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <Box component="span">
                    <Box component="span" sx={{ color: 'text.secondary' }}>
                      {t('studio.ratio')}:{' '}
                    </Box>
                    <Box component="span" sx={{ color: 'secondary.main' }}>
                      256x256
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <Box component="span">
                    <Box component="span" sx={{ color: 'text.secondary' }}>
                      {t('studio.size')}:{' '}
                    </Box>
                    <Box component="span" sx={{ color: 'secondary.main' }}>
                      {'<500Kb'}
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </Stack>
            <Box sx={{ flex: 1, cursor: readOnly ? 'default' : 'pointer', display: 'flex', alignItems: 'flex-end' }}>
              <Avatar
                variant="square"
                sx={{ width: 80, height: 80 }}
                alt="Blocklet Logo"
                src={initLogoUrl || logoUrl}
                onClick={() => {
                  if (!checkCanUpload()) {
                    return;
                  }
                  uploaderLogoRef.current?.open();
                }}
              />
            </Box>
          </Box>
          {hasLogoWarning && <Warning errors={logoErrors} storeList={storeList} mt={3} />}
          <Box
            sx={{
              display: 'flex',
              mt: 3,
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}>
            <Stack direction="column" spacing={1} sx={{ mr: 2, width: '160px' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {t('common.screenshot')}
              </Typography>
              <Stack
                direction="column"
                spacing={1}
                sx={{
                  alignItems: 'flex-start',
                  opacity: 0.8,
                  fontSize: '12px',
                }}>
                <Box sx={{ border: 'none' }} variant="outlined" size="small">
                  <Box component="span">
                    <Box component="span" sx={{ color: 'text.secondary' }}>
                      {t('studio.ratio')}:{' '}
                    </Box>
                    <Box component="span" sx={{ color: 'secondary.main' }}>
                      16 / 9
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <Box component="span">
                    <Box component="span" sx={{ color: 'text.secondary' }}>
                      {t('studio.count')}:{' '}
                    </Box>
                    <Box component="span" sx={{ color: 'secondary.main' }}>
                      1~5
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <Box component="span">
                    <Box component="span" sx={{ color: 'text.secondary' }}>
                      {t('studio.size')}:{' '}
                    </Box>
                    <Box component="span" sx={{ color: 'secondary.main' }}>
                      &lt;5MB
                    </Box>
                  </Box>
                </Box>
                {!readOnly && (
                  <Box>
                    <Box component="span">
                      <Box component="span" sx={{ color: 'text.secondary' }}>
                        {t('studio.order')}:{' '}
                      </Box>
                      <Box component="span" sx={{ color: 'secondary.main' }}>
                        {t('studio.orderTip')}
                      </Box>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Stack>
            <DragDropContext onDragEnd={readOnly ? undefined : onDragScreenshotsEnd}>
              <Droppable droppableId="screenshots" direction="horizontal" isDropDisabled={readOnly}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1,
                      flexWrap: 'wrap',
                      minHeight: 160,
                      background: snapshot.isDraggingOver ? 'grey.100' : 'transparent',
                      transition: 'background-color 0.2s ease',
                      border: snapshot.isDraggingOver ? '2px dashed #999' : 'none',
                      borderRadius: '4px',
                    }}>
                    {screenshotUrls.map((x, index) => (
                      <Draggable key={x} draggableId={x} index={index} isDragDisabled={readOnly}>
                        {(provided, snapshot) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="screenshot"
                            sx={{
                              transform: snapshot.isDragging ? 'scale(1.05)' : 'none',
                              boxShadow: snapshot.isDragging ? '0 5px 10px rgba(0,0,0,0.15)' : 'none',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            }}>
                            <img alt="screenshot" src={x} />
                            {!readOnly && (
                              <IconButton
                                {...provided.dragHandleProps}
                                className="action"
                                style={{
                                  right: 40,
                                  zIndex: 10,
                                  color: '#fff',
                                }}>
                                <DragIndicatorIcon />
                              </IconButton>
                            )}
                            {!readOnly && (
                              <IconButton
                                className="action"
                                onClick={() => {
                                  setParams((item) => {
                                    const arr = [...item.blockletScreenshots];
                                    arr.splice(index, 1);
                                    return {
                                      ...item,
                                      blockletScreenshots: arr,
                                    };
                                  });
                                }}>
                                <DeleteOutlineIcon />
                              </IconButton>
                            )}
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {screenshotUrls.length < 5 && (
                      <Box
                        onClick={() => {
                          if (!checkCanUpload()) {
                            return;
                          }
                          uploaderScreenshotRef.current?.open();
                        }}
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontSize: 40,
                          width: 240,
                          height: 135,
                          background: '#eee',
                          cursor: readOnly ? 'default' : 'pointer',
                          color: '#999',
                          mb: 2,
                        }}>
                        +
                      </Box>
                    )}
                  </Box>
                )}
              </Droppable>
            </DragDropContext>
          </Box>
          {hasScreenshotWarning && <Warning errors={screenshotErrors} storeList={storeList} />}
          <Box
            sx={{
              display: 'flex',
              mt: 3,
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}>
            <Stack direction="column" spacing={1} sx={{ mr: 2, width: '160px' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {t('studio.video')}
              </Typography>
              <Stack
                direction="column"
                spacing={1}
                sx={{
                  alignItems: 'flex-start',
                  opacity: 0.8,
                  fontSize: '12px',
                }}>
                <Box>
                  <Box component="span">
                    <Box component="span" sx={{ color: 'text.secondary' }}>
                      {t('studio.videoType')}:{' '}
                    </Box>
                    <Box component="span" sx={{ color: 'secondary.main' }}>
                      <a href="https://www.youtube.com/" target="_blank" rel="noreferrer">
                        Youtube
                      </a>
                      ,{' '}
                      <a href="https://vimeo.com/" target="_blank" rel="noreferrer">
                        Vimeo
                      </a>
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <Box component="span">
                    <Box component="span" sx={{ color: 'text.secondary' }}>
                      {t('studio.count')}:{' '}
                    </Box>
                    <Box component="span" sx={{ color: 'secondary.main' }}>
                      1~3
                    </Box>
                  </Box>
                </Box>
                {!readOnly && (
                  <Box>
                    <Box component="span">
                      <Box component="span" sx={{ color: 'text.secondary' }}>
                        {t('studio.order')}:{' '}
                      </Box>
                      <Box component="span" sx={{ color: 'secondary.main' }}>
                        {t('studio.orderTip')}
                      </Box>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Stack>
            <DragDropContext onDragEnd={readOnly ? undefined : onDragVideosEnd}>
              <Droppable droppableId="videos" direction="horizontal" isDropDisabled={readOnly}>
                {(provided, video) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1,
                      flexWrap: 'wrap',
                      minHeight: 160,
                      background: video.isDraggingOver ? '#f5f5f5' : 'transparent',
                      transition: 'background-color 0.2s ease',
                      border: video.isDraggingOver ? '2px dashed #999' : 'none',
                      borderRadius: '4px',
                    }}>
                    {params.blockletVideos.map((x, index) => (
                      <Draggable key={x} draggableId={x} index={index} isDragDisabled={readOnly}>
                        {(provided, video) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="screenshot"
                            sx={{
                              transform: video.isDragging ? 'scale(1.05)' : 'none',
                              boxShadow: video.isDragging ? '0 5px 10px rgba(0,0,0,0.15)' : 'none',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            }}>
                            <VideoEmbed
                              url={x}
                              style={{
                                pointerEvents: video.isDragging ? 'none' : 'auto',
                              }}
                            />
                            {!readOnly && (
                              <IconButton
                                {...provided.dragHandleProps}
                                className="action"
                                style={{
                                  right: 40,
                                  zIndex: 10,
                                  color: '#fff',
                                }}>
                                <DragIndicatorIcon />
                              </IconButton>
                            )}
                            {!readOnly && (
                              <IconButton
                                className="action"
                                onClick={() => {
                                  setParams((item) => {
                                    const arr = [...item.blockletVideos];
                                    arr.splice(index, 1);
                                    return {
                                      ...item,
                                      blockletVideos: arr,
                                    };
                                  });
                                }}>
                                <DeleteOutlineIcon />
                              </IconButton>
                            )}
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {params.blockletVideos.length < 3 && (
                      <Box
                        onClick={() => {
                          if (!checkCanUpload()) {
                            return;
                          }
                          setShowVideoDialog(true);
                        }}
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontSize: 40,
                          width: 240,
                          height: 135,
                          background: '#eee',
                          cursor: readOnly ? 'default' : 'pointer',
                          color: '#999',
                          mb: 2,
                        }}>
                        +
                      </Box>
                    )}
                  </Box>
                )}
              </Droppable>
            </DragDropContext>
          </Box>
        </Box>
      </Box>
      <Suspense fallback={<EmptySpinner />}>
        <UploaderComponent
          key="uploader-logo"
          ref={uploaderLogoRef}
          locale={locale}
          popup
          onUploadFinish={(result) => {
            setParams({ blockletLogo: result.data.filename });
            setInitLogoUrl('');
            uploaderLogoRef.current?.close();
          }}
          plugins={['ImageEditor']}
          installerProps={{ disabled: true }}
          apiPathProps={{
            uploader: uploadLogoPrefix,
            disableMediaKitPrefix: true,
            disableMediaKitStatus: true,
          }}
          coreProps={{
            restrictions: {
              allowedFileTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
              maxFileSize: 1024 * 1024 * 0.5, // 0.5 MB
              maxNumberOfFiles: 1,
            },
          }}
          dashboardProps={{
            autoOpen: 'imageEditor',
          }}
          imageEditorProps={{
            actions: {
              revert: true,
              rotate: true,
              granularRotate: true,
              flip: true,
              zoomIn: true,
              zoomOut: true,
              cropSquare: false,
              cropWidescreen: false,
              cropWidescreenVertical: false,
            },
            cropperOptions: {
              autoCrop: true,
              aspectRatio: 1,
              initialAspectRatio: 1,
              autoCropArea: 1,
              croppedCanvasOptions: {
                minWidth: 256,
                minHeight: 256,
              },
            },
          }}
        />
        {showVideoDialog && (
          <VideoDialog onClose={() => setShowVideoDialog(false)} params={params} setParams={setParams} />
        )}
        <UploaderComponent
          key="uploader-screenshot"
          ref={uploaderScreenshotRef}
          locale={locale}
          popup
          onUploadFinish={(result) => {
            setParams((item) => {
              const blockletScreenshots = item.blockletScreenshots || [];
              blockletScreenshots.push(result.data?.filename);
              return { ...item, blockletScreenshots };
            });
            uploaderScreenshotRef.current?.close();
          }}
          installerProps={{ disabled: true }}
          plugins={['ImageEditor']}
          apiPathProps={{
            uploader: uploadScreenshotPrefix,
            disableMediaKitPrefix: true,
            disableMediaKitStatus: true,
          }}
          coreProps={{
            restrictions: {
              allowedFileTypes: ['image/*', 'image/svg+xml'],
              maxFileSize: 1024 * 1024 * 5, // 5 MB
              maxNumberOfFiles: 5 - screenshotUrls.length,
            },
          }}
          imageEditorProps={{
            actions: {
              revert: true,
              rotate: true,
              granularRotate: true,
              flip: true,
              zoomIn: true,
              zoomOut: true,
              cropSquare: false,
              cropWidescreen: false,
              cropWidescreenVertical: false,
            },
            cropperOptions: {
              autoCrop: true,
              autoCropArea: 1,
              aspectRatio: 16 / 9,
              initialAspectRatio: 16 / 9,
              croppedCanvasOptions: {
                minWidth: 1280,
                minHeight: 720,
                // 2x
                maxWidth: 1280 * 2,
                maxHeight: 720 * 2,
              },
            },
          }}
        />
      </Suspense>
    </Content>
  );
}

Branding.propTypes = {
  projectId: PropTypes.string.isRequired,
  readOnly: PropTypes.bool.isRequired,
  params: PropTypes.object.isRequired,
  setParams: PropTypes.func.isRequired,
  paramsErrTip: PropTypes.object.isRequired,
  setParamsErrTip: PropTypes.func.isRequired,
  warning: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  blocklet: PropTypes.object.isRequired,
  setLoading: PropTypes.func.isRequired,
  initUrl: PropTypes.object,
  componentDid: PropTypes.string,
  initLogoUrl: PropTypes.string.isRequired,
  setInitLogoUrl: PropTypes.func.isRequired,
};

const Content = styled.div`
  margin-top: 24px;
  .screenshot {
    margin-bottom: 16px;
    max-width: 240px;
    max-height: 135px;
    width: 240px;
    height: 135px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #eee;
    margin-right: 16px;
    position: relative;
    .action {
      visibility: hidden;
      position: absolute;
      width: 42px;
      height: 42px;
      right: 6px;
      top: 6px;
      border-radius: 4px;
      background-color: rgba(0, 0, 0, 1);
      color: rgba(255, 255, 255, 1);
    }
    &:hover .action {
      visibility: visible;
    }
  }
  .screenshot img {
    width: 100%; /* 图像宽度填充容器 */
    height: auto; /* 图像高度自适应 */
  }
`;

export default Branding;
