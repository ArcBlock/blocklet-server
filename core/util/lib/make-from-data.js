const fs = require('fs');
const FormData = require('form-data');

const makeFormData = ({ tarFile: file, hasDiff, did, serverVersion, deleteSet, rootDid, mountPoint, dist }) => {
  let varFields = hasDiff
    ? '$file: Upload!, $did: String, $diffVersion: String, $deleteSet: [String!]'
    : '$file: Upload!';
  let inputFields = hasDiff
    ? 'file: $file, did: $did, diffVersion: $diffVersion, deleteSet: $deleteSet'
    : 'file: $file';

  varFields = `${varFields}, $rootDid: String, $mountPoint: String, $dist: BlockletDistInput`;
  inputFields = `${inputFields}, rootDid: $rootDid, mountPoint: $mountPoint, dist: $dist`;

  const variables = hasDiff
    ? {
        file: null,
        did,
        diffVersion: serverVersion,
        deleteSet,
      }
    : {
        file: null,
      };

  variables.rootDid = rootDid;
  variables.mountPoint = mountPoint;
  variables.dist = dist;

  const apiName = 'installComponent';
  const query = `
    mutation (${varFields}) {
      ${apiName}(input: { ${inputFields} } ) {
        code
        blocklet {
          meta {
            did
            name
            title
            version
            description
          }
          status
          source
        }
      }
    }
  `;
  const gql = {
    query,
    variables,
  };
  const map = {
    file0: ['variables.file'],
  };
  const form = new FormData();
  form.append('operations', JSON.stringify(gql));
  form.append('map', JSON.stringify(map));
  form.append('file0', fs.createReadStream(file));
  return { form, apiName };
};

module.exports = makeFormData;
