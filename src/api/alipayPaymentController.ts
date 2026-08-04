// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 POST /api/payment/alipay/notify */
export async function notify(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.notifyParams,
  options?: { [key: string]: any }
) {
  return request<string>("/api/payment/alipay/notify", {
    method: "POST",
    params: {
      ...params,
      params: undefined,
      ...params["params"],
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/payment/alipay/return */
export async function returnFromAlipay(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.returnFromAlipayParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/payment/alipay/return", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
