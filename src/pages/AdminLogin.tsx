import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to new auth-based login
    navigate('/admin-auth-login', { replace: true });
  }, [navigate]);

  return null; // Component will redirect immediately
};

export default AdminLogin;