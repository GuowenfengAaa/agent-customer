// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 GET /api/user/profile */
export async function profile(options?: { [key: string]: any }) {
  return request<API.ResultUserProfileVO>("/api/user/profile", {
    method: "GET",
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /api/user/profile/password */
export async function changePassword(
  body: API.PasswordChangeDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultVoid>("/api/user/profile/password", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /api/user/profile/preference */
export async function savePreference(
  body: API.PreferenceSaveDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultPreferenceVO>("/api/user/profile/preference", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
