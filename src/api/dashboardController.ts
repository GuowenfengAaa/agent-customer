// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 GET /api/admin/dashboard */
export async function dashboard(options?: { [key: string]: any }) {
  return request<API.ResultDashboardVO>("/api/admin/dashboard", {
    method: "GET",
    ...(options || {}),
  });
}
