import React from 'react';
import TrafficInsights from '@abtnode/ux/lib/analytics/traffic';

import { useNodeContext } from '../../contexts/node';

export default function TrafficAnalyticsPage() {
  const { api, info } = useNodeContext();
  return <TrafficInsights client={api} did={info.did} />;
}
