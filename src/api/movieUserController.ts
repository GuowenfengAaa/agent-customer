// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 GET /api/user/movies */
export async function list(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listParams,
  options?: { [key: string]: any }
) {
  return request<API.ResultMoviePageVO>("/api/user/movies", {
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

/** 此处后端没有提供注释 GET /api/user/movies/${param0} */
export async function detail(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.detailParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ResultMovieVO>(`/api/user/movies/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}
