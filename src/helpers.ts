// helpers.ts

import axios from 'axios';
import type { ComposerTranslation } from 'vue-i18n';

export function getResponseMessage(t: ComposerTranslation, responseId: number, success: boolean): string {
  let msg = '';
  if (responseId >= 1000) {
    msg = t('custom_responses[' + (responseId - 1000) + ']');
    if (!success) {
      msg += ' (E' + responseId + ')';
    }
  } else {
    msg = t('apibase.backend[' + responseId + ']');
    if (!success) {
      msg += ' (E' + responseId.toString().padStart(3, '0') + ')';
    }
  }
  return msg;
}

export async function getCsrfToken(): Promise<string> {
  const csrfToken = getCookie('csrf_token');
  if (csrfToken != '') {
    return csrfToken;
  }
  await axios.get('/auth/csrf_token');
  return getCookie('csrf_token');
}

// Source: https://www.w3schools.com/js/js_cookies.asp
function getCookie(name: string): string {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split('=').map((c) => c.trim());
    if (cookieName === name) {
      return cookieValue ? decodeURIComponent(cookieValue) : '';
    }
  }
  return '';
}
