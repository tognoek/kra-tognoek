"use client";

import { useMemo } from "react";

interface ContributionGraphProps {
  data: { date: string; count: number }[];
  year?: number;
}

export default function ContributionGraph({ data, year }: ContributionGraphProps) {
  // Tạo map từ data để dễ lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((item) => {
      map.set(item.date, item.count);
    });
    return map;
  }, [data]);

  // Tạo danh sách 365 ngày (hoặc 366 nếu năm nhuận)
  const days = useMemo(() => {
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31);
    const daysInYear = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const daysList: { date: Date; count: number }[] = [];
    for (let i = 0; i < daysInYear; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      daysList.push({
        date,
        count: dataMap.get(dateStr) || 0,
      });
    }
    return daysList;
  }, [year, dataMap]);

  // Tính toán màu sắc dựa trên số lượng
  const getColor = (count: number): string => {
    if (count === 0) return "#ebedf0";
    if (count <= 2) return "#9be9a8";
    if (count <= 5) return "#40c463";
    if (count <= 10) return "#30a14e";
    return "#216e39";
  };

  // Nhóm theo tuần (7 ngày) - GitHub style: Chủ nhật là ngày đầu tuần
  const weeks: { date: Date; count: number }[][] = [];
  let currentWeek: { date: Date; count: number }[] = [];
  
  // Tìm ngày đầu tuần của năm (0 = Chủ nhật, 1 = Thứ 2, ...)
  const firstDay = days[0].date;
  const firstDayOfWeek = firstDay.getDay();
  
  // Thêm các ngày trống ở đầu tuần đầu tiên (từ Chủ nhật đến ngày đầu tiên)
  for (let i = 0; i < firstDayOfWeek; i++) {
    const emptyDate = new Date(firstDay);
    emptyDate.setDate(emptyDate.getDate() - (firstDayOfWeek - i));
    currentWeek.push({ date: emptyDate, count: 0 });
  }

  days.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  // Thêm tuần cuối nếu chưa đủ 7 ngày
  if (currentWeek.length > 0) {
    const lastDate = currentWeek[currentWeek.length - 1].date;
    while (currentWeek.length < 7) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + (currentWeek.length - days.length + 1));
      currentWeek.push({
        date: nextDate,
        count: 0,
      });
    }
    weeks.push(currentWeek);
  }

  const maxCount = Math.max(...days.map((d) => d.count), 1);
  const totalContributions = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <div style={{ padding: "20px", background: "white", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 600 }}>
          Hoạt động nộp bài {year || new Date().getFullYear()}
        </h3>
        <div style={{ fontSize: "14px", color: "#666" }}>
          {totalContributions} bài nộp trong {days.filter((d) => d.count > 0).length} ngày
        </div>
      </div>

      <div style={{ overflowX: "auto", marginBottom: "12px", display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: "3px", minWidth: "fit-content" }}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {week.map((day, dayIndex) => {
                const targetYear = year || new Date().getFullYear();
                const isCurrentYear = day.date.getFullYear() === targetYear;
                
                const dateStr = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, "0")}-${String(day.date.getDate()).padStart(2, "0")}`;
                const dayCount = isCurrentYear ? (dataMap.get(dateStr) || 0) : 0;
                
                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    style={{
                      width: "11px",
                      height: "11px",
                      borderRadius: "2px",
                      background: getColor(dayCount),
                      cursor: "pointer",
                      position: "relative",
                    }}
                    title={isCurrentYear ? `${dateStr}: ${dayCount} bài nộp` : ""}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#666" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span>Less</span>
          <div style={{ display: "flex", gap: "2px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#ebedf0" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#9be9a8" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#40c463" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#30a14e" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#216e39" }} />
          </div>
          <span>More</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {["Mon", "Wed", "Fri"].map((day) => (
            <span key={day} style={{ fontSize: "11px" }}>
              {day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

