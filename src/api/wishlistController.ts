// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 GET /api/user/wishlist */
export async function list(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listParams,
  options?: { [key: string]: any }
) {
  return request<API.ResultMoviePageVO>("/api/user/wishlist", {
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

/** 此处后端没有提供注释 PUT /api/user/wishlist/${param0} */
export async function add(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.addParams,
  options?: { [key: string]: any }
) {
  const { movieId: param0, ...queryParams } = params;
  return request<API.ResultVoid>(`/api/user/wishlist/${param0}`, {
    method: "PUT",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /api/user/wishlist/${param0} */
export async function remove(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.removeParams,
  options?: { [key: string]: any }
) {
  const { movieId: param0, ...queryParams } = params;
  return request<API.ResultVoid>(`/api/user/wishlist/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}
