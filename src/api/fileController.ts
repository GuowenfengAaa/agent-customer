// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 POST /api/admin/upload */
export async function upload(body: {}, options?: { [key: string]: any }) {
  return request<API.ResultUploadResultDTO>("/api/admin/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
