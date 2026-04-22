/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable no-shadow */
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import EmptySpinner from '@abtnode/ux/lib/empty-spinner';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { getEmbedUrl, getVideoCheckUrl, getVideoCoverUrl } from '@blocklet/images/lib/video';
import styled from '@emotion/styled';
import ClearIcon from '@mui/icons-material/Clear';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useDebounceFn, useRequest } from 'ahooks';
import PropTypes from 'prop-types';
import React, { Suspense, lazy, useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

import StudioLayout from '../../components/layout/studio';

// eslint-disable-next-line import/no-unresolved
const UploaderComponent = lazy(() => import('@blocklet/uploader').then((res) => ({ default: res.Uploader })));

const uploadLogoPrefix = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/studio/logo/upload`;
const uploadScreenshotPrefix = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/studio/screenshots/upload`;
const logoUrl = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/studio/logo`;
const imageUrl = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/studio/screenshots`;
const videoUrl = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/studio/videos`;

const maxScreenshots = 5;
const maxVideos = 3;

export default function StudioBranding() {
  const { t, locale } = useLocaleContext();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [screenshots, setScreenshots] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedVideo, setSelectedVideo] = useState('');
  const [logoTimestamp, setLogoTimestamp] = useState(Date.now());

  const state = useRequest(async () => {
    const res = await fetch(imageUrl);
    const data = await res.json();
    setScreenshots(data.screenshots || []);
    setVideos(data.videos?.filter((item) => !!item) || []);
    return data;
  });

  const uploaderLogoRef = useRef(null);
  const uploaderScreenshotRef = useRef(null);

  if (state.loading && !state.data) {
    return (
      <StudioLayout>
        <EmptySpinner size={40} />
      </StudioLayout>
    );
  }

  if (state.error) {
    return (
      <StudioLayout>
        <Stack direction="column" spacing={1} sx={{ mb: 3 }}>
          <Typography
            sx={{
              color: 'error.main',
              fontWeight: 'bold',
            }}>
            {state.error.message}
          </Typography>
        </Stack>
      </StudioLayout>
    );
  }

  const updateVideos = async (items) => {
    const arr = items.filter((item) => !!item);
    setVideos(arr);
    await fetch(videoUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videos: arr }),
    });
  };

  const handleReorderVideos = async (result) => {
    const items = Array.from(videos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    await updateVideos(items);
  };

  const handleReorderScreenshots = async (result) => {
    const items = Array.from(screenshots);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setScreenshots(items);

    // Update order on server
    await fetch(`${imageUrl}/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screenshots: items }),
    });
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.source.droppableId === 'screenshots') {
      await handleReorderScreenshots(result);
    } else if (result.source.droppableId === 'videos') {
      await handleReorderVideos(result);
    }
    state.runAsync();
  };

  const handleOpenVideo = (video) => {
    setSelectedVideo(video.trim());
    setShowConfirm(true);
  };
  const handleOperateVideo = async (newVideo, originalVideo = '') => {
    let newVideos = [];
    if (originalVideo) {
      newVideos = newVideo
        ? videos.map((item) => (item === originalVideo ? newVideo.trim() : item))
        : videos.filter((item) => item !== originalVideo);
    } else if (newVideo) {
      newVideos = [...videos, newVideo.trim()];
    }

    setSelectedVideo('');
    setShowConfirm(false);
    if (newVideo || originalVideo) {
      await updateVideos(newVideos);
    }
    state.runAsync();
  };

  const handleOpenLightbox = (image) => {
    setLightboxOpen(true);
    setSelectedImage(image);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
    setSelectedImage('');
  };

  function renderLogo() {
    const rules = [
      { label: t('studio.type'), value: 'png, jpg, webp, svg' },
      { label: t('studio.ratio'), value: '256x256' },
      { label: t('studio.size'), value: '<500KB' },
    ];
    const tips = [{ label: t('studio.tip'), value: t('studio.change') }];
    return (
      <Section title={t('common.logo')} rules={rules} tips={tips}>
        <Box sx={{ flex: 1, cursor: 'pointer' }}>
          <Avatar
            variant="square"
            sx={{ width: 128, height: 128 }}
            alt="Blocklet Logo"
            src={`${logoUrl}?t=${logoTimestamp}`}
            onClick={() => uploaderLogoRef.current?.open()}
          />
        </Box>
      </Section>
    );
  }

  function renderScreenshots() {
    const rules = [
      { label: t('studio.ratio'), value: '16 / 9' },
      { label: t('studio.count'), value: `1~${maxScreenshots}` },
      { label: t('studio.size'), value: '<5MB' },
    ];
    const tips = [{ label: t('studio.tip'), value: t('studio.orderTipLong') }];
    return (
      <Section title={t('common.screenshot')} tips={tips} rules={rules}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="screenshots" direction="horizontal">
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flex: 1,
                  mt: 1,
                  flexWrap: 'wrap',
                  minHeight: 225,
                  background: snapshot.isDraggingOver ? '#f5f5f5' : 'transparent',
                  transition: 'background-color 0.2s ease',
                  border: snapshot.isDraggingOver ? '2px dashed #999' : 'none',
                  borderRadius: '4px',
                }}>
                {screenshots.map((imgName, index) => (
                  <Draggable key={imgName} draggableId={imgName} index={index}>
                    {(provided, snapshot) => {
                      const url = `${imageUrl}/${imgName}`;
                      return (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="image-wrapper"
                          sx={{
                            transform: snapshot.isDragging ? 'scale(1.05)' : 'none',
                            boxShadow: snapshot.isDragging ? '0 5px 10px rgba(0,0,0,0.15)' : 'none',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          }}>
                          <img
                            alt="screenshot"
                            src={url}
                            onClick={() => handleOpenLightbox(imgName)}
                            style={{ cursor: 'pointer' }}
                          />
                          <Tooltip title={t('studio.deleteTooltip')}>
                            <IconButton
                              className="action"
                              style={{ top: 10, color: 'white', background: 'red' }}
                              onClick={async () => {
                                await fetch(url, { method: 'DELETE' });
                                state.runAsync();
                              }}>
                              <DeleteOutlineIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      );
                    }}
                  </Draggable>
                ))}
                {provided.placeholder}
                {screenshots.length < maxScreenshots && renderAddButton()}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      </Section>
    );

    function renderAddButton() {
      return (
        <Box
          onClick={() => uploaderScreenshotRef.current?.open()}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 2,
            width: 400,
            height: 225,
            fontSize: 40,
            background: '#eee',
            cursor: 'pointer',
            color: '#999',
          }}>
          +
        </Box>
      );
    }
  }

  function renderVideos() {
    const rules = [
      { label: t('studio.count'), value: `1~${maxVideos}` },
      {
        label: t('studio.videoType'),
        value: (
          <>
            <a href="https://www.youtube.com/" target="_blank" rel="noreferrer">
              Youtube
            </a>
            ,{' '}
            <a href="https://vimeo.com/" target="_blank" rel="noreferrer">
              Vimeo
            </a>
          </>
        ),
      },
    ];
    const tips = [{ label: `${t('studio.tip')}`, value: t('studio.videoTipLong') }];
    return (
      <Section title={t('studio.video')} tips={tips} rules={rules}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="videos" direction="horizontal">
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flex: 1,
                  mt: 1,
                  flexWrap: 'wrap',
                  minHeight: 225,
                  background: snapshot.isDraggingOver ? '#f5f5f5' : 'transparent',
                  transition: 'background-color 0.2s ease',
                  border: snapshot.isDraggingOver ? '2px dashed #999' : 'none',
                  borderRadius: '4px',
                }}>
                {videos.map((video, index) => (
                  <Draggable key={video} draggableId={video} index={index}>
                    {(provided, snapshot) => {
                      return (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="image-wrapper"
                          sx={{
                            transform: snapshot.isDragging ? 'scale(1.05)' : 'none',
                            boxShadow: snapshot.isDragging ? '0 5px 10px rgba(0,0,0,0.15)' : 'none',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          }}>
                          <img
                            alt="videos"
                            src={getVideoCoverUrl(video)}
                            onClick={() => handleOpenVideo(video)}
                            style={{ cursor: 'pointer' }}
                          />
                          <Box
                            sx={{ position: 'absolute', cursor: 'pointer', fontSize: '3rem' }}
                            onClick={() => handleOpenVideo(video)}>
                            <VideoIcon />
                          </Box>
                          <Tooltip title={t('studio.deleteTooltip')}>
                            <IconButton
                              className="action"
                              style={{ top: 10, color: 'white', background: 'red' }}
                              onClick={() => handleOperateVideo(null, video)}>
                              <DeleteOutlineIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      );
                    }}
                  </Draggable>
                ))}
                {provided.placeholder}
                {videos.length < maxVideos && renderAddButton()}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
        {showConfirm && (
          <VideoDialog t={t} handleOperateVideo={handleOperateVideo} defaultUrl={selectedVideo} videos={videos} />
        )}
      </Section>
    );

    function renderAddButton() {
      return (
        <Box
          onClick={() => setShowConfirm(true)}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 2,
            width: 400,
            height: 225,
            fontSize: 40,
            background: '#eee',
            cursor: 'pointer',
            color: '#999',
          }}>
          +
        </Box>
      );
    }
  }

  function renderPreview() {
    return (
      <Dialog
        open={lightboxOpen}
        onClose={handleCloseLightbox}
        maxWidth="xl"
        slotProps={{
          paper: {
            style: {
              backgroundColor: 'transparent',
              boxShadow: 'none',
            },
          },
        }}>
        <img
          src={`${imageUrl}/${selectedImage}`}
          alt="Screenshot Full"
          style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
          onClick={handleCloseLightbox}
        />
      </Dialog>
    );
  }

  function renderUploader() {
    return (
      <Suspense fallback={<EmptySpinner size={40} />}>
        <UploaderComponent
          key="uploader-logo"
          ref={uploaderLogoRef}
          locale={locale}
          popup
          onUploadFinish={() => {
            uploaderLogoRef.current?.close();
            setLogoTimestamp(Date.now());
            state.runAsync();
          }}
          plugins={['ImageEditor']}
          installerProps={{ disabled: true }}
          apiPathProps={{ uploader: uploadLogoPrefix, disableMediaKitPrefix: true, disableMediaKitStatus: true }}
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
        <UploaderComponent
          key="uploader-screenshot"
          ref={uploaderScreenshotRef}
          locale={locale}
          popup
          onUploadFinish={() => {
            uploaderScreenshotRef.current?.close();
            state.runAsync();
          }}
          installerProps={{ disabled: true }}
          plugins={['ImageEditor']}
          apiPathProps={{ uploader: uploadScreenshotPrefix, disableMediaKitPrefix: true, disableMediaKitStatus: true }}
          coreProps={{
            restrictions: {
              allowedFileTypes: ['image/*', 'image/svg+xml'],
              maxFileSize: 1024 * 1024 * 5, // 5 MB
              maxNumberOfFiles: 5 - screenshots.length,
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
    );
  }

  const documentLink = `https://www.arcblock.io/docs/blocklet-store/${locale}/supplying-images`;
  return (
    <StudioLayout>
      <Content>
        <Stack direction="column" spacing={1} sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {t('studio.title', { title: state.data?.title })}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}>
            {t('studio.description')}{' '}
            <a href={documentLink} target="_blank" rel="noreferrer">
              {t('studio.documentation')}
            </a>
          </Typography>
        </Stack>
        {renderLogo()}
        {renderScreenshots()}
        {renderVideos()}
        {renderPreview()}
        {renderUploader()}
      </Content>
    </StudioLayout>
  );
}

function Section({ title, rules, tips, children }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        mb: 4,
      }}>
      <Stack direction="column" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ fontSize: '13px', opacity: 0.8 }}>
          {rules.map((rule) => renderLabelValue(rule.label, rule.value))}
        </Stack>
        {tips.map((tip) => (
          <Box sx={{ fontSize: '13px', opacity: 0.8 }}>{renderLabelValue(tip.label, tip.value)}</Box>
        ))}
      </Stack>
      {children}
    </Box>
  );

  function renderLabelValue(label, value) {
    return (
      <Box component="span">
        <Box component="span" sx={{ color: '#555', mr: 0.5 }}>
          {label}:
        </Box>
        <Box component="span" sx={{ color: '#007ec6' }}>
          {value}
        </Box>
      </Box>
    );
  }
}

Section.propTypes = {
  title: PropTypes.string.isRequired,
  rules: PropTypes.array.isRequired,
  tips: PropTypes.array.isRequired,
  children: PropTypes.node.isRequired,
};

function VideoDialog({ handleOperateVideo, t, defaultUrl = '', videos }) {
  const [inputUrl, setInputUrl] = useState(defaultUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [isInvalidUrl, setIsInvalidUrl] = useState(false);
  const checkedUrl = useRef(inputUrl);

  const isDuplicate = inputUrl !== defaultUrl && videos.includes(inputUrl);
  const showDeleteButton = !inputUrl && defaultUrl;
  const showPreviewButton = !isDuplicate && ((inputUrl && inputUrl !== checkedUrl.current) || isLoading);
  const supportClipboard = !!navigator.clipboard?.readText;

  const { run: checkUrl } = useDebounceFn(handlePreview, { wait: 500, leading: true });

  return (
    <Dialog open fullWidth maxWidth="sm">
      <DialogTitle>{defaultUrl ? t('studio.videoDialogEditTitle') : t('studio.videoDialogTitle')}</DialogTitle>
      <DialogContent>
        <OutlinedInput
          fullWidth
          value={inputUrl}
          onChange={(e) => {
            const url = e.target.value.trim();
            setInputUrl(url);
            if (url) {
              checkUrl(url);
            } else {
              setIsInvalidUrl(false);
            }
          }}
          placeholder={t('studio.videoInputLabel')}
          endAdornment={
            inputUrl ? (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => {
                    setInputUrl('');
                    handlePreview('');
                  }}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ) : (
              supportClipboard && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={async () => {
                      try {
                        const url = ((await navigator.clipboard.readText()) || '').trim();
                        setInputUrl(url);
                        handlePreview(url);
                      } catch (e) {
                        console.error(e);
                      }
                    }}>
                    <ContentPasteIcon />
                  </IconButton>
                </InputAdornment>
              )
            )
          }
        />
        <Box
          sx={{
            mb: 2,
            mt: 0.5,
          }}>
          {isDuplicate && (
            <Typography variant="body2" color="error">
              {t('studio.duplicateVideo')}
            </Typography>
          )}
          {!isDuplicate && isInvalidUrl && (
            <Typography variant="body2" color="error">
              {t('studio.videoDialogNoSrc')}
            </Typography>
          )}
        </Box>
        {checkedUrl.current ? (
          <iframe
            width="100%"
            height="315"
            title={`video-${checkedUrl.current}`}
            src={getEmbedUrl(checkedUrl.current)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            border="1px solid #eee"
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 315,
              width: '100%',
              border: '1px solid #eee',
            }}>
            {isLoading ? (
              <EmptySpinner size={40} />
            ) : (
              <Typography
                variant="h5"
                sx={{
                  color: 'text.secondary',
                }}>
                <VideoIcon />
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleOperateVideo()}>{t('studio.cancel')}</Button>
        {showDeleteButton && (
          <Button variant="contained" color="error" onClick={() => handleOperateVideo(null, defaultUrl)}>
            {t('studio.delete')}
          </Button>
        )}
        {showPreviewButton && (
          <Button variant="contained" onClick={() => handlePreview(inputUrl)} disabled={!inputUrl || isLoading}>
            {t('studio.preview')}
          </Button>
        )}
        {!showDeleteButton && !showPreviewButton && (
          <Button
            variant="contained"
            onClick={() => handleOperateVideo(checkedUrl.current)}
            disabled={!checkedUrl.current || defaultUrl === checkedUrl.current || isDuplicate}>
            {t('studio.confirm')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  function handlePreview(url) {
    checkedUrl.current = '';
    const checkValidUrl = getVideoCheckUrl(url);
    if (url) {
      setIsInvalidUrl(!checkValidUrl);
    } else {
      setIsInvalidUrl(false);
    }
    if (checkValidUrl) {
      setIsLoading(true);
      fetch(checkValidUrl)
        .then((response) => {
          if (response.ok) {
            checkedUrl.current = url;
            setIsInvalidUrl(false);
          } else {
            setIsInvalidUrl(true);
          }
        })
        .catch(() => {
          setIsInvalidUrl(true);
        })
        .finally(() => setIsLoading(false));
    }
  }
}

VideoDialog.propTypes = {
  handleOperateVideo: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  defaultUrl: PropTypes.string,
  videos: PropTypes.array.isRequired,
};

/* eslint-disable react/no-unknown-property */
function VideoIcon() {
  return (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" height={48} width={48}>
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M28 56C43.464 56 56 43.464 56 28C56 12.536 43.464 0 28 0C12.536 0 0 12.536 0 28C0 43.464 12.536 56 28 56Z"
        fill="black"
        fill-opacity="0.54"
      />
      <path fill-rule="evenodd" clip-rule="evenodd" d="M39.6667 28L21 17.5V38.5L39.6667 28Z" fill="white" />
    </svg>
  );
}

const Content = styled.div`
  margin-top: 24px;
  .image-wrapper {
    margin-bottom: 16px;
    max-width: 400px;
    max-height: 225px;
    width: 400px;
    height: 225px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #eee;
    margin-right: 16px;
    position: relative;
    cursor: grab;
    &:active {
      cursor: grabbing;
    }
    .action {
      visibility: hidden;
      position: absolute;
      right: 10px;
      opacity: 0.7;
      background-color: white;
      box-shadow: 0 0 20px 0px #000;
      &:hover {
        opacity: 1;
      }
    }
    &:hover .action {
      visibility: visible;
    }
  }
  .image-wrapper img {
    width: 100%;
    height: auto;
  }
`;
