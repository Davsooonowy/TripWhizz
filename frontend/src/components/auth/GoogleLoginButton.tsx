import React from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";

const GoogleLoginButton = () => {
  const handleSuccess = async (response) => {
    try {
      const res = await axios.post('http://localhost:8000/auth/google_login/', {
        credential: response.credential
      });

      localStorage.setItem('token', res.data.token);
      window.location.href = '/';

    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  return (
    <GoogleOAuthProvider clientId="1063914551103-rtpssmet3p289ut0s7b2hnkbgg8032sr.apps.googleusercontent.com">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.log("Błąd logowania")}
      />
    </GoogleOAuthProvider>
  );
};

export default GoogleLoginButton;
