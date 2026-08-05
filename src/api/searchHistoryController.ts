// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 GET /api/user/search-history */
export async function list(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.searchHistoryListParams,
  options?: { [key: string]: any }
) {
  return request<API.ResultListSearchHistoryVO>("/api/user/search-history", {
    method: "GET",
    params: {
      // limit has a default value: 10
      limit: "10",
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/user/search-history */
export async function record(
  body: API.SearchHistorySaveDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultSearchHistoryVO>("/api/user/search-history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /api/user/search-history */
export async function clear(options?: { [key: string]: any }) {
  return request<API.ResultVoid>("/api/user/search-history", {
    method: "DELETE",
    ...(options || {}),
  });
}
