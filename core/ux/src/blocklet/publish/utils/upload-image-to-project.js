import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import axios from '@abtnode/util/lib/axios';
import { joinURL } from 'ufo';

export const urlToFile = async (url) => {
  if (typeof url !== 'string') {
    throw new Error('URL must be a string');
  }
  try {
    const filename = url.split('/').pop().split('?')[0];
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  } catch (error) {
    throw new Error('Failed to convert Logo URL to file');
  }
};

function* createFileChunks(file, chunkSize) {
  let offset = 0;
  while (offset < file.size) {
    yield file.slice(offset, offset + chunkSize);
    offset += chunkSize;
  }
}

const uploadImageToProject = async ({ did, projectId, uploadType = 'logo', imageUrl }) => {
  const file = await urlToFile(imageUrl);
  const formData = new FormData();
  formData.append('file', file);
  // Create metadata header
  const metadata = {
    uploaderId: 'Uploader',
    relativePath: encodeURIComponent(file.name),
    name: encodeURIComponent(file.name),
    type: file.type,
  };

  // 使用 Tus 协议上传文件
  const createUploadResponse = await axios.post(
    joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/api/project', did, projectId, uploadType, 'upload'),
    null,
    {
      headers: {
        'Tus-Resumable': '1.0.0',
        'Upload-Length': file.size,
        'X-Uploader-File-Ext': file.name.split('.').pop(),
        'Upload-Metadata': Object.keys(metadata)
          .map((key) => `${key} ${btoa(metadata[key])}`)
          .join(','),
      },
    }
  );
  // Extract the upload URL from the response
  const uploadUrl = createUploadResponse.headers.location;

  // Upload the file in chunks
  const chunkSize = 2 * 1024 * 1024;
  let offset = 0;

  let filename = '';
  for (const chunk of createFileChunks(file, chunkSize)) {
    // eslint-disable-next-line no-await-in-loop
    const res = await axios.patch(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, uploadUrl), chunk, {
      headers: {
        'Tus-Resumable': '1.0.0',
        'Upload-Offset': offset,
        'Content-Type': 'application/offset+octet-stream',
      },
    });
    offset += chunk.size;
    filename = res.data.filename;
  }
  return filename;
};

export default uploadImageToProject;
