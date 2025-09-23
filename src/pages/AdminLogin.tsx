import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to new OTP-based login
    navigate('/admin-otp-login', { replace: true });
  }, [navigate]);

  return null; // Component will redirect immediately
};

export default AdminLogin;