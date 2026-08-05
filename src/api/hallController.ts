// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 GET /api/admin/cinemas/${param0}/halls */
export async function listByCinema(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listByCinemaParams,
  options?: { [key: string]: any }
) {
  const { cinemaId: param0, ...queryParams } = params;
  return request<API.ResultHallPageVO>(`/api/admin/cinemas/${param0}/halls`, {
    method: "GET",
    params: {
      // page has a default value: 1
      page: "1",
      // size has a default value: 10
      size: "10",
      ...queryParams,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/admin/halls */
export async function create(
  body: API.HallCreateDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultVoid>("/api/admin/halls", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /api/admin/halls/${param0} */
export async function update(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateParams,
  body: API.HallUpdateDTO,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ResultVoid>(`/api/admin/halls/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/admin/halls/${param0}/seats */
export async function seats(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: { hallId: number },
  options?: { [key: string]: any }
) {
  const { hallId: param0, ...queryParams } = params;
  return request<API.ResultHallSeatVO>(`/api/admin/halls/${param0}/seats`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/admin/halls/${param0}/seats */
export async function createSeat(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.createSeatParams,
  body: API.SeatCreateDTO,
  options?: { [key: string]: any }
) {
  const { hallId: param0, ...queryParams } = params;
  return request<API.ResultSeatVO>(`/api/admin/halls/${param0}/seats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /api/admin/halls/${param0}/seats/${param1} */
export async function updateSeat(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateSeatParams,
  body: API.SeatUpdateDTO,
  options?: { [key: string]: any }
) {
  const { hallId: param0, seatId: param1, ...queryParams } = params;
  return request<API.ResultSeatVO>(
    `/api/admin/halls/${param0}/seats/${param1}`,
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

/** 此处后端没有提供注释 DELETE /api/admin/halls/${param0}/seats/${param1} */
export async function deleteSeat(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteSeatParams,
  options?: { [key: string]: any }
) {
  const { hallId: param0, seatId: param1, ...queryParams } = params;
  return request<API.ResultVoid>(`/api/admin/halls/${param0}/seats/${param1}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /api/admin/halls/${param0}/seats/layout */
export async function saveSeatLayout(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.saveSeatLayoutParams,
  body: API.SeatLayoutSaveDTO,
  options?: { [key: string]: any }
) {
  const { hallId: param0, ...queryParams } = params;
  return request<API.ResultHallSeatVO>(
    `/api/admin/halls/${param0}/seats/layout`,
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

/** 此处后端没有提供注释 PUT /api/admin/halls/${param0}/status */
export async function updateStatus(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateStatusParams,
  body: API.HallStatusDTO,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ResultVoid>(`/api/admin/halls/${param0}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}
