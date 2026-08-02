// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 GET /api/user/showtimes */
export async function list(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listParams,
  options?: { [key: string]: any }
) {
  return request<API.ResultShowtimeGroupedVO>("/api/user/showtimes", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/user/showtimes/${param0}/seats */
export async function seats(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: { id: number },
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ResultShowtimeSeatLayoutVO>(
    `/api/user/showtimes/${param0}/seats`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}
