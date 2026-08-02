// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 GET /api/admin/orders */
export async function list2(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listParams,
  options?: { [key: string]: any }
) {
  return request<API.ResultOrderPageVO>("/api/admin/orders", {
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

/** 此处后端没有提供注释 GET /api/admin/orders/${param0} */
export async function detail2(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.detailParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ResultOrderDetailVO>(`/api/admin/orders/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/user/orders */
export async function list(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listParams,
  options?: { [key: string]: any }
) {
  return request<API.ResultUserOrderPageVO>("/api/user/orders", {
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

/** 此处后端没有提供注释 GET /api/user/orders/${param0} */
export async function detail(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.detailParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ResultUserOrderDetailVO>(`/api/user/orders/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/user/orders/${param0}/cancel */
export async function cancel(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.cancelParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ResultVoid>(`/api/user/orders/${param0}/cancel`, {
    method: "POST",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/user/orders/${param0}/pay */
export async function pay(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.payParams,
  body: API.PayDTO,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ResultPayResultVO>(`/api/user/orders/${param0}/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/user/orders/lock */
export async function lock(
  body: API.LockSeatsDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultLockResultVO>("/api/user/orders/lock", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
