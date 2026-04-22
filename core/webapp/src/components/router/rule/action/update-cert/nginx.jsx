/* eslint-disable react/jsx-curly-newline */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable react/prop-types */
import { useState } from 'react';
import get from 'lodash/get';
import { useDropzone } from 'react-dropzone';
import { Controller, useForm, useWatch } from 'react-hook-form';
import Box from '@mui/material/Box';

import AddIcon from '@mui/icons-material/Add';
import Spinner from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';

import Button from '@arcblock/ux/lib/Button';
import Dialog from '@arcblock/ux/lib/Dialog';
import DialogContentText from '@mui/material/DialogContentText';
import Alert from '@mui/material/Alert';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useNodeContext } from '../../../../../contexts/node';
import { formatError } from '../../../../../libs/util';

const MAX_FILE_SIZE = 50 * 1024;

const formatCert = content => content.split('\n').join('|');

const readFile = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = err => reject(err);
  });

export default function UpdateNginxCert({ certificate = {}, onRefresh, mode, ...restProps }) {
  const { t } = useLocaleContext();
  const { api } = useNodeContext();
  const [loading, setLoading] = useState(false);
  const [keyFile, setKeyFile] = useState();
  const [pemFile, setPemFile] = useState();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [certSource, setCertSource] = useState('upload');

  const { handleSubmit, formState, control } = useForm({
    defaultValues: {
      name: certificate.name || certificate.domain,
    },
  });

  const name = useWatch({ control, name: 'name' });
  const domain = useWatch({ control, name: 'domain' });

  const disableConfirmButton = () => {
    if (loading) {
      return true;
    }

    if (certSource === 'upload' && mode === 'update') {
      if (!name) {
        return true;
      }

      if (keyFile && !pemFile) {
        return true;
      }

      if (pemFile && !keyFile) {
        return true;
      }

      return false;
    }

    if (certSource === 'upload' && mode === 'add') {
      return !name || !keyFile || !pemFile;
    }

    return certSource === 'lets_encrypt' && !domain;
  };

  const onCancel = () => {
    setLoading(false);
    setOpen(false);
  };

  const submitUpload = async data => {
    if (mode === 'add') {
      const pem = (await readFile(pemFile)).replace(/\r\n/g, '\n');
      const key = (await readFile(keyFile)).replace(/\r\n/g, '\n');
      await api.addCertificate({
        input: {
          name: data.name.trim(),
          certificate: formatCert(pem),
          privateKey: formatCert(key),
        },
      });
    } else {
      const input = {
        id: certificate.id,
        name: data.name.trim(),
      };

      if (pemFile && keyFile) {
        const pem = (await readFile(pemFile)).replace(/\r\n/g, '\n');
        const key = (await readFile(keyFile)).replace(/\r\n/g, '\n');
        input.certificate = formatCert(pem);
        input.privateKey = formatCert(key);
      }

      await api.updateCertificate({ input });
    }
  };

  const submitLetsEncrypt = data => api.issueLetsEncryptCert({ input: { domain: data.domain } });

  const certSources = {
    upload: {
      name: t('router.cert.nginx.sourceTypes.upload'),
      value: 'upload',
      onSubmit: submitUpload,
    },
    lets_encrypt: {
      name: t('router.cert.nginx.sourceTypes.lets_encrypt'),
      value: 'lets_encrypt',
      onSubmit: submitLetsEncrypt,
    },
  };

  const onSubmit = async data => {
    setLoading(true);

    try {
      const source = certSources[certSource];
      if (!source) {
        throw new Error('Invaid certificate source');
      }

      await source.onSubmit(data);
      onRefresh();
      setOpen(false);
    } catch (err) {
      setError(formatError(err) || 'unknown error, may be you can check file permission');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setKeyFile(null);
    setPemFile(null);
    setOpen(true);
    setError('');
  };

  const handleChangeCertSource = e => {
    setCertSource(e.target.value);
  };

  const onDropRejected = files => {
    if (files.length > 0) {
      setError(get(files[0], 'errors[0].message', t('router.cert.add.invalidFile')));
    }
  };

  const { getRootProps: getPemRootProps, getInputProps: getPemInputProps } = useDropzone({
    accept: ['.pem', '.crt'],
    multiple: false,
    maxSize: MAX_FILE_SIZE,
    onDropRejected,
    onDrop: acceptedFiles => {
      setPemFile(acceptedFiles[0]);
    },
  });

  const { getRootProps: getKeyRootProps, getInputProps: getKeyInputProps } = useDropzone({
    accept: ['.pem', '.key'],
    multiple: false,
    maxSize: MAX_FILE_SIZE,
    onDropRejected,
    onDrop: acceptedFiles => {
      setKeyFile(acceptedFiles[0]);
    },
  });

  const { errors } = formState;

  return (
    <>
      <Button edge="end" onClick={handleAdd} className="rule-action" color="primary" data-cy="add-cert" {...restProps}>
        {loading ? <Spinner size={16} /> : <AddIcon style={{ fontSize: 16 }} />}
        {t(mode === 'add' ? 'common.add' : 'common.update')}
      </Button>
      {open && (
        <Dialog
          title={t(mode === 'add' ? 'router.cert.nginx.titleAdd' : 'router.cert.nginx.title')}
          open
          onClose={onCancel}
          actions={
            <>
              <Button onClick={onCancel} color="inherit" data-cy="cert-cancel">
                {t('router.cert.nginx.cancel')}
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                color="secondary"
                disabled={disableConfirmButton()}
                variant="contained"
                autoFocus
                data-cy="save-cert">
                {t('router.cert.nginx.confirm')}
                {loading && <Spinner size={16} />}
              </Button>
            </>
          }>
          <form className="form" data-cy="cert-form" noValidate autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
            <Box
              sx={{
                minWidth: { sm: 480 },
              }}>
              <DialogContentText component="div">
                {mode === 'add' && (
                  <section className="form-item">
                    <div className="form-item-label">{t('router.cert.source')}</div>
                    <RadioGroup
                      aria-label="cert-source"
                      name="certSource"
                      value={certSource}
                      onChange={handleChangeCertSource}>
                      {Object.values(certSources).map(source => (
                        <FormControlLabel
                          key={source.value}
                          value={source.value}
                          control={<Radio />}
                          label={source.name}
                        />
                      ))}
                    </RadioGroup>
                  </section>
                )}
                {certSource === 'upload' && (
                  <>
                    <section className="form-item">
                      <div className="form-item-label">{t('router.cert.name')}</div>
                      <Controller
                        name="name"
                        control={control}
                        rules={{
                          validate: value => {
                            return !!value.trim() || t('common.requiredErrorText', { name: t('router.cert.name') });
                          },
                        }}
                        render={({ field: { value, onChange } }) => {
                          return (
                            <TextField
                              fullWidth
                              autoFocus
                              defaultValue={value}
                              onChange={onChange}
                              error={!!errors.name}
                              autoComplete="off"
                              variant="outlined"
                              name="name"
                              className="form-item-value"
                              data-cy="certificate-name-textfield"
                              helperText={errors.name && errors.name.message}
                            />
                          );
                        }}
                      />
                    </section>
                    <section className="form-item">
                      <div className="form-item-label">
                        {t('router.cert.nginx.pem')}
                        {mode === 'update' && (
                          <Typography component="small" variant="body2" color="textSecondary">
                            {' '}
                            ({t('common.optional')})
                          </Typography>
                        )}
                      </div>
                      <div className="form-item-value">
                        <div {...getPemRootProps({ className: 'dropzone' })}>
                          <input {...getPemInputProps()} data-cy="pem-input" />
                          {pemFile && <Typography color="secondary">{pemFile.name}</Typography>}
                          {!pemFile && <Typography color="secondary">{t('router.cert.nginx.empty')}</Typography>}
                          <Typography component="small" variant="body2" color="textSecondary">
                            {t('router.cert.nginx.pemTip')}
                          </Typography>
                        </div>
                      </div>
                    </section>
                    <section className="form-item">
                      <div className="form-item-label">
                        {t('router.cert.nginx.key')}
                        {mode === 'update' && (
                          <Typography component="small" variant="body2" color="textSecondary">
                            {' '}
                            ({t('common.optional')})
                          </Typography>
                        )}
                      </div>
                      <div className="form-item-value">
                        <div {...getKeyRootProps({ className: 'dropzone' })}>
                          <input {...getKeyInputProps()} data-cy="key-input" />
                          {keyFile && <Typography color="secondary">{keyFile.name}</Typography>}
                          {!keyFile && <Typography color="secondary">{t('router.cert.nginx.empty')}</Typography>}
                          <Typography component="small" variant="body2" color="textSecondary">
                            {t('router.cert.nginx.keyTip')}
                          </Typography>
                        </div>
                      </div>
                    </section>
                  </>
                )}
                {certSource === 'lets_encrypt' && (
                  <>
                    <section className="form-item">
                      <Alert severity="success">{t('router.cert.genLetsEncryptCert.dnsTip')}</Alert>
                    </section>
                    <section className="form-item">
                      <div className="form-item-label">{t('common.domain')}</div>
                      <Controller
                        name="domain"
                        control={control}
                        rules={{
                          validate: value =>
                            !!value.trim() || t('common.requiredErrorText', { name: t('common.domain') }),
                        }}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            fullWidth
                            autoFocus
                            defaultValue={value}
                            error={!!errors.domain}
                            autoComplete="off"
                            variant="outlined"
                            className="form-item-value"
                            helperText={errors.domain && errors.domain.message}
                            onChange={onChange}
                          />
                        )}
                      />
                    </section>
                  </>
                )}
              </DialogContentText>
              {!!error && (
                <Alert severity="error" style={{ marginTop: 8 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </form>
        </Dialog>
      )}
    </>
  );
}
