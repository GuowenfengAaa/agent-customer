// @ts-ignore
/* eslint-disable */
import request from "@/services/openapiRequest";

/** 此处后端没有提供注释 GET /api/user/agent/memory/current */
export async function current(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.currentParams,
  options?: { [key: string]: any }
) {
  return request<API.ResultAgentMemoryVO>("/api/user/agent/memory/current", {
    method: "GET",
    params: {
      // limit has a default value: 50
      limit: "50",
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/user/agent/memory/list */
export async function list(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listParams,
  options?: { [key: string]: any }
) {
  return request<API.ResultListAgentSessionSummaryVO>(
    "/api/user/agent/memory/list",
    {
      method: "GET",
      params: {
        // limit has a default value: 20
        limit: "20",
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** 此处后端没有提供注释 POST /api/user/agent/memory/sync */
export async function sync(
  body: API.AgentMemorySyncDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultAgentMemoryVO>("/api/user/agent/memory/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/user/agent/memory/turn */
export async function saveTurn(
  body: API.AgentMemoryTurnDTO,
  options?: { [key: string]: any }
) {
  return request<API.ResultAgentMemoryVO>("/api/user/agent/memory/turn", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
