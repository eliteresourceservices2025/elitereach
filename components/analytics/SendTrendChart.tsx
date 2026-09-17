function formatDayLabel(date: string) {
  const [, month, day] = date.split("-");
  return `${month}/${day}`;
}

export function SendTrendChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex items-end gap-1.5" style={{ height: 140 }}>
      {data.map((d) => (
        <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date}: ${d.count} sent`}>
          <div
            className="w-full min-w-[4px] rounded-t bg-elite-violet/80"
            style={{ height: `${Math.max(4, (d.count / max) * 100)}px` }}
          />
          <span className="text-[10px] text-gray-400">{formatDayLabel(d.date)}</span>
        </div>
      ))}
    </div>
  );
}
