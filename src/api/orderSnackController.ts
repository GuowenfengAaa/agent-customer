// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 GET /api/user/orders/${param0}/snacks */
export async function get(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getParams,
  options?: { [key: string]: any }
) {
  const { orderId: param0, ...queryParams } = params;
  return request<API.ResultSnackSelectionVO>(
    `/api/user/orders/${param0}/snacks`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 此处后端没有提供注释 PUT /api/user/orders/${param0}/snacks */
export async function replace(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.replaceParams,
  body: API.OrderSnackSelectionDTO,
  options?: { [key: string]: any }
) {
  const { orderId: param0, ...queryParams } = params;
  return request<API.ResultSnackSelectionVO>(
    `/api/user/orders/${param0}/snacks`,
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
