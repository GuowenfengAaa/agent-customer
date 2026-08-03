// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** GET /api/user/search-history */
export async function list(
  params?: API.searchHistoryListParams,
  options?: { [key: string]: any },
) {
  return request<API.ResultSearchHistoryListVO>("/api/user/search-history", {
    method: "GET",
    params: {
      limit: "10",
      ...(params || {}),
    },
    ...(options || {}),
  });
}

/** POST /api/user/search-history */
export async function record(
  body: API.SearchHistorySaveDTO,
  options?: { [key: string]: any },
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

/** DELETE /api/user/search-history */
export async function clear(options?: { [key: string]: any }) {
  return request<API.ResultVoid>("/api/user/search-history", {
    method: "DELETE",
    ...(options || {}),
  });
}
