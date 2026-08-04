import dayjs, { Dayjs } from "dayjs";
import React from "react";
import styles from "./index.module.less";

interface BookingDateTabsProps {
  value: Date;
  onChange: (date: Date) => void;
  days?: number;
}

const weekdayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const getDateLabel = (date: Dayjs, offset: number) => {
  if (offset === 0) return "今天";
  if (offset === 1) return "明天";
  if (offset === 2) return "后天";
  return weekdayLabels[date.day()];
};

const BookingDateTabs: React.FC<BookingDateTabsProps> = ({
  value,
  onChange,
  days = 7,
}) => {
  const selected = dayjs(value).format("YYYY-MM-DD");
  const today = dayjs().startOf("day");
  const dates = Array.from({ length: days }, (_, offset) => {
    const date = today.add(offset, "day");
    return {
      date,
      key: date.format("YYYY-MM-DD"),
      label: getDateLabel(date, offset),
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
