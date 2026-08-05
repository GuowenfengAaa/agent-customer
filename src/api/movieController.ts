// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 GET /api/admin/movies */
export async function list(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listParams,
  options?: { [key: string]: any }
) {
  return request<API.ResultMoviePageVO>("/api/admin/movies", {
    method: "GET",
    params: {
      // page has a default value: 1
      page: "1",
      // size has a default value: 10
      size: "10",

      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/admin/movies */
export async function create(
  body: API.MovieCreateDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultVoid>("/api/admin/movies", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/admin/movies/${param0} */
export async function detail(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.detailParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ResultMovieVO>(`/api/admin/movies/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /api/admin/movies/${param0} */
export async function update(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateParams,
  body: API.MovieUpdateDTO,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ResultVoid>(`/api/admin/movies/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /api/admin/movies/${param0} */
export async function deleteMovie(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteMovieParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ResultVoid>(`/api/admin/movies/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /api/admin/movies/${param0}/status */
export async function updateStatus(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateStatusParams,
  body: API.MovieStatusDTO,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ResultVoid>(`/api/admin/movies/${param0}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/admin/movies/options */
export async function options(options?: { [key: string]: any }) {
  return request<API.ResultListMovieOptionVO>("/api/admin/movies/options", {
    method: "GET",
    ...(options || {}),
  });
}
