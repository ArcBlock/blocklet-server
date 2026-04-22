import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from 'react-use/lib/useLocalStorage';

import { BlockletEvents } from '@blocklet/constant';

import useQuery from './query';
import { useSubscription } from '../libs/ws';

export default function useBlockletPurchase(did) {
  const query = useQuery();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useLocalStorage(`sid:blocklet:purchase:${did}`);
  const [hasCompleted, setCompleted] = useState(false);
  const [session, setSession] = useState(null);

  const doRedirect = () => {
    const { pathname, searchParams } = new URL(window.location.href);
    const prefix = window.env && window.env.apiPrefix ? window.env.apiPrefix : '/';
    if (searchParams.get('sid')) {
      setSessionId('');
      navigate(pathname.replace(prefix, '/'), { replace: true });
    }
  };

  const hasPurchased = !!(query.get('assetDid') && sessionId && query.get('sid') === sessionId);

  useSubscription(BlockletEvents.purchaseChange, e => {
    if (e.did === did) {
      setSession(e.session);

      if (['declined', 'confirmed', 'error'].includes(e.session.status)) {
        setCompleted(true);
        setTimeout(doRedirect, 2000);
      }
    }
  });

  useEffect(() => {
    if (session && session.id !== sessionId) {
      setSessionId(session.id);
    }
  }, [session]); // eslint-disable-line

  return {
    hasCompleted,
    hasPurchased,
    session,
    setSession,
    doRedirect,
  };
}
