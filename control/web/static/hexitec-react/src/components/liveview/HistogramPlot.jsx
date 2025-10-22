import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

function HistogramPlot({ histogramData, regionId, color }) {
  if (!histogramData) return null;

  // Format data for recharts
  const data = histogramData.counts.map((count, index) => ({
    energy: index,
    count: count
  }));

  const regionInfo = histogramData.region;

  return (
    <div className="p-3 border rounded bg-light position-relative">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 style={{ color: color.stroke, marginBottom: 0 }}>Region {regionId}</h5>
      </div>
      
      {/* Region coordinates */}
      <div className="mb-2 p-2 bg-white border rounded">
        <div className="small">
          <div>X: [{regionInfo.x[0]}, {regionInfo.x[1]}]</div>
          <div>Y: [{regionInfo.y[0]}, {regionInfo.y[1]}]</div>
          <div>Size: {regionInfo.width} × {regionInfo.height} pixels</div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-2">
        <div className="small">
          <table className="table table-sm table-borderless mb-0">
            <tbody>
              <tr>
                <td>Mean:</td>
                <td>{histogramData.mean.toFixed(1)}</td>
              </tr>
              <tr>
                <td>Std Dev:</td>
                <td>{histogramData.std.toFixed(1)}</td>
              </tr>
              <tr>
                <td>Peak:</td>
                <td>{histogramData.max.toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Energy spectrum plot */}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart 
          data={data} 
          margin={{ top: 5, right: 10, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="energy"
            label={{ 
              value: 'Energy Bin', 
              position: 'bottom', 
              offset: -15,
              fontSize: 12
            }}
            tick={{ fontSize: 10 }}
          />
          <YAxis 
            label={{ 
              value: 'Counts', 
              angle: -90, 
              position: 'insideLeft', 
              offset: -15,
              fontSize: 12
            }}
            tick={{ fontSize: 10 }}
          />
          <Tooltip 
            formatter={(value) => [value.toFixed(1), 'Counts']}
            labelFormatter={(value) => `Energy Bin: ${value}`}
          />
          <Line 
            type="monotone"
            dataKey="count"
            stroke={color.stroke}
            dot={false}
            strokeWidth={2}
            name="Counts"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default HistogramPlot;