import dayjs from "dayjs";
import React from "react";
import styles from "./index.module.less";

interface BookingDateTabsProps {
  value: Date;
  onChange: (date: Date) => void;
  days?: number;
  /** 起始日期：默认今天。待上映影片传上映日期，使可选区间从上映日开始。 */
  startDate?: Date;
}

const weekdayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const BookingDateTabs: React.FC<BookingDateTabsProps> = ({
  value,
  onChange,
  days = 7,
  startDate,
}) => {
  const selected = dayjs(value).format("YYYY-MM-DD");
  const today = dayjs().startOf("day");
  const base = startDate ? dayjs(startDate).startOf("day") : today;
  const dates = Array.from({ length: days }, (_, offset) => {
    const date = base.add(offset, "day");
    const diff = date.diff(today, "day");
    const label =
      diff === 0
        ? "今天"
        : diff === 1
        ? "明天"
        : diff === 2
        ? "后天"
        : weekdayLabels[date.day()];
    return {
      date,
      key: date.format("YYYY-MM-DD"),
      label,
    };
  });

  return (
    <div className={styles.dateTabs} role="tablist" aria-label="选择购票日期">
      {dates.map((item) => {
        const active = item.key === selected;
        return (
          <button
            key={item.key}
            className={`${styles.dateTab} ${active ? styles.active : ""}`}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.date.toDate())}
          >
            <span>{item.label}</span>
            <strong>{item.date.format("M月D日")}</strong>
          </button>
        );
      })}
    </div>
  );
};

export default BookingDateTabs;
