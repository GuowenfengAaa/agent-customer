// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 POST /api/admin/auth/login */
export async function login(
  body: API.LoginDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultLoginVO>("/api/admin/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
