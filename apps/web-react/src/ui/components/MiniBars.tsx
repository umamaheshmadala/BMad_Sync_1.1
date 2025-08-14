import React from 'react';

export function MiniBars({
  entries,
  maxY,
  renderBar,
  height = 120,
  gap = 6,
  width = 16,
  border = '1px solid #333',
  padding = '6px 0',
  legend,
  showTooltips = true,
}: {
  entries: Array<[string, any]>;
  maxY: number;
  renderBar: (day: string, value: any, scaled: (v: number) => number) => React.ReactNode;
  height?: number;
  gap?: number;
  width?: number;
  border?: string;
  padding?: string;
  legend?: React.ReactNode;
  showTooltips?: boolean;
}) {
  const scaled = (v: number) => Math.max(2, Math.round((v / (maxY || 1)) * (height - 10)));
  return (
    <div>
      {legend ? (<div style={{ marginBottom: 4 }}>{legend}</div>) : null}
      <div style={{ display: 'flex', gap, alignItems: 'flex-end', height, borderBottom: border, padding }}>
        {entries.map(([day, v]) => (
          <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width }} title={showTooltips ? String(day) : undefined}>
            {renderBar(day, v, scaled)}
          </div>
        ))}
      </div>
    </div>
  );
}


