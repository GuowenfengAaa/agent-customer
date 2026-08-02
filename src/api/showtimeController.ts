// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 GET /api/admin/showtimes */
export async function list(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listParams,
  options?: { [key: string]: any }
) {
  return request<API.ResultShowtimePageVO>("/api/admin/showtimes", {
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

/** 此处后端没有提供注释 POST /api/admin/showtimes */
export async function create(
  body: API.ShowtimeCreateDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultShowtimeVO>("/api/admin/showtimes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /api/admin/showtimes/${param0} */
export async function update(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateParams,
  body: API.ShowtimeUpdateDTO,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ResultShowtimeVO>(`/api/admin/showtimes/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/admin/showtimes/${param0}/seats */
export async function seats(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: { id: number },
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ResultShowtimeSeatLayoutVO>(
    `/api/admin/showtimes/${param0}/seats`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 此处后端没有提供注释 PUT /api/admin/showtimes/${param0}/seats/status */
export async function updateSeatStatus(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateSeatStatusParams,
  body: API.ShowtimeSeatStatusDTO,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ResultShowtimeSeatStatusVO>(
    `/api/admin/showtimes/${param0}/seats/status`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      params: { ...queryParams },
      data: body,
      ...(options || {}),
    }
  );
}

/** 此处后端没有提供注释 PUT /api/admin/showtimes/${param0}/status */
export async function updateStatus(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateStatusParams,
  body: API.ShowtimeStatusDTO,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ResultShowtimeVO>(
    `/api/admin/showtimes/${param0}/status`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      params: { ...queryParams },
      data: body,
      ...(options || {}),
    }
  );
}
