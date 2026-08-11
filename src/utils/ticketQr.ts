import type { OrderDetail } from "@/types/domain";

/**
 * 订单级二维码内容：把整单的购票信息存进一个二维码。
 * - 单张票：直接复用后端生成的 qr_content（与后端一致）。
 * - 多张票：把所有票的 qr_content 合并为 JSON 数组，包含全部购票信息。
 * - 兜底：缺少 qr_content 时按订单字段拼装。
 */
export function buildOrderQrValue(order: OrderDetail): string {
  const tickets = order.tickets || [];

  if (tickets.length === 1 && tickets[0].qrContent) {
    return tickets[0].qrContent;
  }

  const objects = tickets
    .map((ticket) => {
      if (!ticket.qrContent) return null;
      try {
        return JSON.parse(ticket.qrContent);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (objects.length && objects.length === tickets.length) {
    return JSON.stringify(objects);
  }

  return JSON.stringify({
    movie: order.movie?.name || order.movieName || '',
    cinema: order.cinema?.name || order.cinemaName || '',
    hall: order.hallName || '',
    startAt: order.startAt || '',
    seats: tickets.map((ticket) =>
      ticket.rowNo !== undefined && ticket.seatNo !== undefined
        ? `${ticket.rowNo}排${ticket.seatNo}座`
        : '座位'
    ),
    ticketCodes: tickets.map((ticket) => ticket.ticketCode).filter(Boolean),
  });
}

/** 取票码（字母组合）：所有票的取票码拼接展示。 */
export function buildTicketCodesText(order: OrderDetail): string {
  const codes = (order.tickets || [])
    .map((ticket) => ticket.ticketCode)
    .filter(Boolean);
  return codes.join('、') || '--';
}
