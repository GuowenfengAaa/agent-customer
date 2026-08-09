import { history, useLocation } from '@umijs/max';
import React, { useEffect, useRef } from 'react';
import CustomerLayout from '@/components/CustomerLayout';
import { getToken } from '@/services/storage';
import { confirmLogin, getLoginPath } from '@/utils/authNavigation';

const PUBLIC_PATHS = [
  /^\/home$/,
  /^\/search$/,
  /^\/movies$/,
  /^\/movies\/[^/]+$/,
  /^\/cinemas$/,
  /^\/cinemas\/[^/]+\/showtimes$/,
];

const CustomerWrapper: React.FC = () => {
  const location = useLocation();
  const token = getToken();
  const promptStarted = useRef(false);
  const isPublicPath = PUBLIC_PATHS.some((pattern) => pattern.test(location.pathname));

  useEffect(() => {
    if (token || isPublicPath) {
      promptStarted.current = false;
      return;
    }
    if (promptStarted.current) return;

    promptStarted.current = true;
    const redirect = location.pathname + location.search;
    void confirmLogin().then((confirmed) => {
      history.replace(confirmed ? getLoginPath(redirect) : '/home');
    });
  }, [isPublicPath, location.pathname, location.search, token]);

  if (!token && !isPublicPath) return null;

  return <CustomerLayout />;
};

export default CustomerWrapper;
