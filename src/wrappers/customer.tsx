import { Navigate, useLocation } from '@umijs/max';
import React from 'react';
import CustomerLayout from '@/components/CustomerLayout';
import { getToken } from '@/services/storage';

const CustomerWrapper: React.FC = () => {
  const location = useLocation();
  const token = getToken();

  if (!token) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?redirect=${redirect}`} replace />;
  }

  return <CustomerLayout />;
};

export default CustomerWrapper;
