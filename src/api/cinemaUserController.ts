// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 GET /api/user/cinemas */
export async function list(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listParams,
  options?: { [key: string]: any }
) {
  return request<API.ResultCinemaPageVO>("/api/user/cinemas", {
    method: "GET",
    params: {
      // page has a default value: 1
      page: "1",
      // size has a default value: 20
      size: "20",

      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/user/cinemas/nearby */
export async function nearby(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.nearbyParams,
  options?: { [key: string]: any }
) {
  return request<API.ResultCinemaPageVO>("/api/user/cinemas/nearby", {
    method: "GET",
    params: {
      // page has a default value: 1
      page: "1",
      // size has a default value: 20
      size: "20",

      // radius has a default value: 5
      radius: "5",
      ...params,
    },
    ...(options || {}),
  });
}
