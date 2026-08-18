import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    navigate(`/admin-auth-login${location.search}`, { replace: true });
  }, [navigate, location.search]);

  return null; // Component will redirect immediately
};

export default AdminLogin;