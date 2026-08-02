// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 POST /api/user/draft */
export async function save(
  body: API.DraftSaveDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultDraftVO>("/api/user/draft", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/user/draft/current */
export async function current(options?: { [key: string]: any }) {
  return request<API.ResultDraftVO>("/api/user/draft/current", {
    method: "GET",
    ...(options || {}),
  });
}
