# Certificate Manager

Manage SSL certificates:

- 管理上传的证书
- 生成/自动更新 Let's Encrypt 证书
- 过期提醒

## Usage

### Well-known route

```javascript
const certificateManager = require('@abtnode/certificate-manager');

app.use(certificateManager.routes);
```

### Core Manager

#### Initialize

```javascript
const CertificateManager = require('@abtnode/certificate-manager/sdk/manager');

const certManager = new CertificateManager({
  maintainerEmail: '{email of the certificate manager}',
  dataDir: '{data directory of the certificate manager}',
});

certManager.start(); // Start renewal cron jobs
```

#### Events

1. cert.issued: Issue certificate successfully
1. cert.error: Issue certificate failed

#### CRUD

- `getAll()`: Get all certificates, includes in-progress status.
- `getAllNormal()`: Get normal state certificate, without in-progress status.
- `getByDomain(domain)`: Get the certificate by domain.
- `add(certificate)`: Add certificate to database.
- `issue(domain)`: Add the generate certificate task.
- `upsertByDomain(certificate)`: Add certificate to database, if the domain already exists, update it.
- `update(id, certificate)`: Update certificate by ID.
- `remove(id)`: Remove certificate by ID.
- `addWithoutValidations(certificate)`: Same as `add(certificate)`, but no data validation.
