/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import get from 'lodash/get';

import { useNodeContext } from '../../../../../contexts/node';

import UpdateNginxCert from './nginx';

export default function UpdateCert(props) {
  const { info } = useNodeContext();

  const domain = props.name;
  const provider = get(info, 'routing.provider', 'default');

  // Its meaningless to add certificates for ip
  if (domain === info.ip) {
    return null;
  }

  if (provider === 'nginx') {
    return <UpdateNginxCert mode="update" {...props} />;
  }

  return null;
}
