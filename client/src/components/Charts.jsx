import React, { useMemo } from 'react';

export function DonutChart({ data, size = 130 }) {
  const total = Math.max(data.reduce((sum, item) => sum + item.value, 0), 1);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--border)" strokeWidth="14" />
        {data.map(item => {
          const length = item.value / total * circumference;
          const circle = (
            <circle
              key={item.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="14"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            />
          );
          offset += length;
          return circle;
        })}
        <text x="60" y="58" textAnchor="middle" style={{ fill: 'var(--text)', font: '800 20px Manrope' }}>
          {total === 1 && data.every(item => !item.value) ? 0 : total}
        </text>
        <text x="60" y="73" textAnchor="middle" style={{ fill: 'var(--text-4)', font: '600 9px DM Sans' }}>
          TOTAL
        </text>
      </svg>
      <div className="donut-leg">
        {data.map(item => (
          <span key={item.label}>
            <i style={{ background: item.color }} />
            {item.label}
            <strong>{item.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

export function TrendChart({ tickets, days = 7 }) {
  const points = useMemo(() => {
    const result = [];
    for (let index = days - 1; index >= 0; index -= 1) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - index);
      const end = start.getTime() + 864e5;

      result.push({
        day: start.toLocaleDateString('en-GB', { weekday: 'short' }),
        count: tickets.filter(ticket => ticket.createdAt >= start.getTime() && ticket.createdAt < end).length,
      });
    }
    return result;
  }, [tickets, days]);

  const max = Math.max(3, ...points.map(point => point.count));
  const width = 420;
  const height = 150;
  const x = index => 30 + index * (width - 50) / (days - 1);
  const y = count => height - 28 - count / max * (height - 50);
  const line = points.map((point, index) => `${index ? 'L' : 'M'}${x(index)},${y(point.count)}`).join(' ');

  return (
    <svg className="trend" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {[0, 0.5, 1].map(fraction => (
        <line
          key={fraction}
          className="gl"
          x1="30"
          x2={width - 20}
          y1={y(max * fraction)}
          y2={y(max * fraction)}
        />
      ))}
      <path className="ar" d={`${line} L${x(days - 1)},${height - 28} L${x(0)},${height - 28}Z`} />
      <path className="ln" d={line} />
      {points.map((point, index) => (
        <g key={point.day}>
          <circle cx={x(index)} cy={y(point.count)} r="3.5" fill="var(--accent)" />
          <text x={x(index)} y={height - 10} textAnchor="middle">{point.day}</text>
        </g>
      ))}
    </svg>
  );
}
