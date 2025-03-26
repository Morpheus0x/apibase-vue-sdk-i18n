// request.ts

import type { AxiosResponse, AxiosError } from 'axios';
import axios from 'axios';
import type { ComposerTranslation } from 'vue-i18n';

import type { ApiResponse, JsonResponse, RedirectTarget, ApiResponseStream } from './types';
import { getResponseMessage, getCsrfToken } from './helpers';

// Requires the t function returned by vue-i18n useI18n(), might return redirect target
export async function Get<T>(t: ComposerTranslation, path: string): Promise<ApiResponse<T>> {
  let out: ApiResponse<T> = {
    success: false,
    text: '',
    httpStatus: 0,
    data: {} as T
  };

  const csrfToken = await getCsrfToken();
  if (csrfToken == '') {
    out.text = t('apibase.frontend.no_csrf_token');
    return out;
  }
  const response = await axios
    .get(path, {
      headers: { 'Content-Type': 'multipart/form-data', 'X-XSRF-TOKEN': csrfToken }
    })
    .then((res: AxiosResponse) => {
      console.log('response: ', res);
      out.httpStatus = res.status;
      out.success = true;
      return res.data as JsonResponse<T>;
    })
    .catch((err: AxiosError) => {
      console.log('error: ', err);
      out.httpStatus = err.status || 0;
      if (err.response && (err.response.data as JsonResponse<T>).id != 0) {
        return err.response?.data as JsonResponse<T>;
      } else {
        console.log('Unknown Response from API: ', err);
        return {
          id: -1,
          msg: t('apibase.frontend.invalid_error_response')
        } as JsonResponse<T>;
      }
    });
  out.data = response.data;
  if (response.id === -1) {
    out.text = response.msg;
  } else {
    out.text = getResponseMessage(t, response.id, out.success);
  }
  return out;
}

export async function StreamGet<T>(
  t: ComposerTranslation,
  path: string,
  progressCallback: <T>(data: ApiResponseStream<T>) => void
): Promise<ApiResponse<T>> {
  let out: ApiResponse<T> = {
    success: false,
    text: '',
    httpStatus: 0,
    data: {} as T
  };

  const csrfToken = await getCsrfToken();
  if (csrfToken == '') {
    out.text = t('apibase.frontend.no_csrf_token');
    return out;
  }

  const response = await axios
    .get(path, {
      headers: { 'Content-Type': 'multipart/form-data', 'X-XSRF-TOKEN': csrfToken },
      responseType: 'stream',
      adapter: 'fetch',
      maxContentLength: 10000000000,
      transformResponse: (x) => x // prevent axios from parsing json by itself
    })
    .then(async (res: AxiosResponse) => {
      // Source: https://stackoverflow.com/a/78434519
      const reader = res.data.pipeThrough(new TextDecoderStream()).getReader();
      let finalStreamResponse: JsonResponse<ApiResponseStream<T>> = {
        id: 0,
        msg: '',
        data: {
          stage: 0,
          content: '',
          data: {} as T
        }
      };
      let streamResponseBuffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        // console.log('Streaming Response: ', value);
        value.split(/\r?\n/).forEach((singleResponse: string) => {
          // console.log('Multi Line Response Line: ', singleResponse);
          if (singleResponse === '') {
            return;
          }
          console.log('StreamGet singleResponse: ', singleResponse);
          let streamResponse = {} as JsonResponse<ApiResponseStream<T>>;
          try {
            streamResponse = JSON.parse(streamResponseBuffer + singleResponse) as JsonResponse<ApiResponseStream<T>>;
            streamResponseBuffer = '';
          } catch {
            streamResponseBuffer += singleResponse;
            return;
          }
          // console.log(streamResponse);
          switch (streamResponse.data.stage) {
            case -1:
              out.httpStatus = res.status;
              out.success = false;
              break;
            case 0:
              out.httpStatus = res.status;
              out.success = true;
              finalStreamResponse = streamResponse;
              break;
            default:
              progressCallback(streamResponse.data);
          }
        });
      }
      if (streamResponseBuffer !== '') {
        out.success = false;
        return {
          id: -1,
          msg: 'stream response incomplete!!!',
          data: {}
        } as JsonResponse<ApiResponseStream<T>>;
      }
      if (out.success === true) {
        return finalStreamResponse;
      }
    })
    .catch(async (err: AxiosError) => {
      console.log('axios streaming error: ', err);
      out.httpStatus = err.status || 0;
      if (err.response) {
        console.log('GetStream AxiosError: ', err);
        // try {
        //   return JSON.parse(err.response?.data as string) as JsonResponse<null>;
        // } catch (e) {
        // console.log('unable to parse error response', e);
        const reader = (err.response.data as ReadableStream).pipeThrough(new TextDecoderStream()).getReader();
        let lastResponse = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          console.log('Stream Response Error read value: ', value);
          value.split(/\r?\n/).forEach((singleResponse: string) => {
            if (singleResponse !== '') {
              lastResponse = singleResponse;
            }
          });
        }
        if (lastResponse !== '') {
          return JSON.parse(lastResponse) as JsonResponse<null>;
        }
      }
      // }
      console.log('Unknown Response from API: ', err);
      return {
        id: -1,
        msg: t('apibase.frontend.invalid_error_response')
      } as JsonResponse<null>;
    });
  console.log('Final Streaming Response: ', response);
  if (response == undefined) {
    out.text = t('apibase.frontend.invalid_error_response');
    return out;
  }
  if (response.data == null || (Object.keys(response.data).length === 0 && response.data.constructor === Object)) {
    if (response.id === -1) {
      out.text = response.msg;
    } else {
      console.log('getResponseMessage for: ', response.id);
      out.text = getResponseMessage(t, response.id, out.success);
    }
    return out;
  }
  out.text = response.data.content;
  out.data = response.data.data;
  return out;
}
