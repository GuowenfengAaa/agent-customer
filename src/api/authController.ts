// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 POST /api/auth/login */
export async function login(
  body: API.LoginDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultLoginVO>("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/auth/login/email */
export async function loginByEmailCode(
  body: API.EmailLoginDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultLoginVO>("/api/auth/login/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/auth/logout */
export async function logout(options?: { [key: string]: any }) {
  return request<API.ResultVoid>("/api/auth/logout", {
    method: "POST",
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/auth/register */
export async function register(
  body: API.RegisterDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultVoid>("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/auth/reset-password */
export async function resetPassword(
  body: API.ResetPasswordDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultVoid>("/api/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/auth/send-code */
export async function sendCode(
  body: API.SendCodeDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultVoid>("/api/auth/send-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
