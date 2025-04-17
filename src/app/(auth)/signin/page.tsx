'use client';

import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { SignInSuccessResponse } from './type';
import { AuthStatus, useAuth } from '@/providers/AuthProvider';
import { Spinner } from '@/components/Spinner';
import { handleResponse } from '@/utils/handleResponse';
import { useApiInstance } from '@/hooks/useApiInstance';
import { isFailureResponse } from '@/utils/isFailureResponse';

export default function Signin() {
  const api = useApiInstance();
  const { setAuthStatus } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLoginSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    try {
      setLoading(true);
      const payload = {
        auth_token: credentialResponse.credential,
      };

      const response: SignInSuccessResponse = await handleResponse(
        api.post('/internal/gauth', payload),
      );

      if (response.access_token) {
        setAuthStatus(AuthStatus.ValidateAccess);
      }
    } catch (error) {
      if (isFailureResponse(error)) {
        toast.error(error.message || 'Login failed');
      } else {
        toast.error('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 bg-2dp_purple-100">
      {loading ? (
        <Spinner />
      ) : (
        <div className="bg-white shadow-lg rounded-lg p-8 w-[550px] h-[430px] mt-[-350px]">
          <div>trying darling</div>
          <div className="logo mt-3 ml-[30%]"></div>
          <div className="flex justify-center mt-[140px] pl-2">
            <GoogleLogin
              type="standard"
              theme="outline"
              size="large"
              shape="rectangular"
              logo_alignment="center"
              width={230}
              locale="en"
              onSuccess={handleGoogleLoginSuccess}
              onError={() => toast.error('Login failed')}
            />
          </div>
        </div>
      )}
    </div>
  );
}
