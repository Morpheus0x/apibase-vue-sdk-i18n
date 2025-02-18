// auth_local.ts

import type { AxiosResponse, AxiosError } from 'axios';
import axios from 'axios';
import type { ComposerTranslation } from 'vue-i18n';

import type { ApiResponse, JsonResponse, RedirectTarget } from './types';
import { getResponseMessage, getCsrfToken } from './helpers';

// Requires the t function returned by vue-i18n useI18n(), might return redirect target
export async function Login(t: ComposerTranslation, email: string, password: string): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('email', email);
  formData.append('password', password);

  let out: ApiResponse = {
    success: false,
    text: '',
    httpStatus: 0,
    redirect: undefined
  };

  const csrfToken = await getCsrfToken();
  if (csrfToken == '') {
    out.text = t('apibase.frontend.no_csrf_token');
    return out;
  }
  const response = await axios
    .post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data', 'X-XSRF-TOKEN': csrfToken }
    })
    .then((res: AxiosResponse) => {
      // console.log('response: ', res);
      out.httpStatus = res.status;
      out.success = true;
      return res.data as JsonResponse;
    })
    .catch((err: AxiosError) => {
      // console.log('error: ', err);
      out.httpStatus = err.status || 0;
      if (err.response) {
        return err.response?.data as JsonResponse;
      } else {
        console.log('Unknown Response from API: ', err);
        return {
          id: -1,
          msg: t('apibase.frontend.invalid_error_response')
        } as JsonResponse;
      }
    });
  if (
    response.data &&
    typeof response.data === 'object' &&
    'ref' in response.data &&
    'target' in response.data
  ) {
    out.redirect = (response.data as RedirectTarget).target;
  }
  if (response.id === -1) {
    out.text = response.msg;
    return out;
  }
  out.text = getResponseMessage(t, response.id, out.success);
  return out;
}

// Requires the t function returned by vue-i18n useI18n()
export async function Signup(
  t: ComposerTranslation,
  username: string,
  email: string,
  password: string,
  passwordConfirmed: string
): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('email', email);
  formData.append('password', password);
  formData.append('password-confirm', passwordConfirmed);

  let out: ApiResponse = {
    success: false,
    text: '',
    httpStatus: 0,
    redirect: undefined
  };

  const csrfToken = await getCsrfToken();
  if (csrfToken == '') {
    out.text = t('apibase.frontend.no_csrf_token');
    return out;
  }
  const response = await axios
    .post('/auth/signup', formData, {
      headers: { 'Content-Type': 'multipart/form-data', 'X-XSRF-TOKEN': csrfToken }
    })
    .then((res: AxiosResponse) => {
      // console.log('response: ', res);
      out.httpStatus = res.status;
      out.success = true;
      return res.data as JsonResponse;
    })
    .catch((err: AxiosError) => {
      // console.log('error: ', err);
      out.httpStatus = err.status || 0;
      if (err.response) {
        return err.response?.data as JsonResponse;
      } else {
        console.log('Unknown Response from API: ', err);
        return {
          id: -1,
          msg: t('apibase.frontend.invalid_error_response')
        } as JsonResponse;
      }
    });
  if (response.id === -1) {
    out.text = response.msg;
    return out;
  }
  out.text = getResponseMessage(t, response.id, out.success);
  return out;
}

// Requires the t function returned by vue-i18n useI18n(), might return redirect target
export async function Logout(t: ComposerTranslation, provider: string): Promise<ApiResponse> {
  let out: ApiResponse = {
    success: false,
    text: '',
    httpStatus: 0,
    redirect: undefined
  };

  const csrfToken = await getCsrfToken();
  if (csrfToken == '') {
    out.text = t('apibase.frontend.no_csrf_token');
    return out;
  }

  let path = '/auth/logout';
  if (provider !== 'local' && provider.length > 0) {
    path += '/' + provider;
  }
  const response = await axios
    .get(path, {
      headers: { 'Content-Type': 'multipart/form-data', 'X-XSRF-TOKEN': csrfToken }
    })
    .then((res: AxiosResponse) => {
      console.log('response: ', res);
      out.httpStatus = res.status;
      out.success = true;
      return res.data as JsonResponse;
    })
    .catch((err: AxiosError) => {
      console.log('error: ', err);
      out.httpStatus = err.status || 0;
      if (err.response) {
        return err.response?.data as JsonResponse;
      } else {
        console.log('Unknown Response from API: ', err);
        return {
          id: -1,
          msg: t('apibase.frontend.invalid_error_response')
        } as JsonResponse;
      }
    });
  console.log('logout parsed response: ', response);
  if (
    response.data &&
    typeof response.data === 'object' &&
    'ref' in response.data &&
    'target' in response.data
  ) {
    out.redirect = (response.data as RedirectTarget).target;
  }
  if (response.id === -1) {
    out.text = response.msg;
    return out;
  }
  out.text = getResponseMessage(t, response.id, out.success);
  return out;
}

export async function IsLoggedIn(): Promise<boolean> {
  const csrfToken = await getCsrfToken();
  if (csrfToken == '') {
    return false;
  }

  return await axios
    .get('/api/check_login', {
      headers: { 'Content-Type': 'multipart/form-data', 'X-XSRF-TOKEN': csrfToken }
    })
    .then((res: AxiosResponse) => {
      console.log('IsLoggedIn: ', res);
      if (res.status == 401) {
        // Unauthorized
        return false;
      }
      return true;
    })
    .catch((err: AxiosError) => {
      console.log('IsLoggedIn err: ', err);
      return false;
    });
}
