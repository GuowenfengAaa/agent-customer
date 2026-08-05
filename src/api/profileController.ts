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

/** 此处后端没有提供注释 POST /api/user/profile/avatar */
export async function updateAvatar(
  body: {},
  file?: File,
  options?: { [key: string]: any }
) {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === "object" && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ""));
        } else {
          formData.append(
            ele,
            new Blob([JSON.stringify(item)], { type: "application/json" })
          );
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<API.ResultUploadResultDTO>("/api/user/profile/avatar", {
    method: "POST",
    data: formData,
    requestType: "form",
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /api/user/profile/email */
export async function changeEmail(
  body: API.EmailChangeDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultVoid>("/api/user/profile/email", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/user/profile/email/code */
export async function sendNewEmailCode(
  body: API.NewEmailCodeDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultVoid>("/api/user/profile/email/code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
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

/** 此处后端没有提供注释 POST /api/user/profile/security/code */
export async function sendSecurityCode(options?: { [key: string]: any }) {
  return request<API.ResultVoid>("/api/user/profile/security/code", {
    method: "POST",
    ...(options || {}),
  });
}
