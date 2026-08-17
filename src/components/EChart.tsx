import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface EChartProps {
  options: any;
  style?: React.CSSProperties;
  className?: string;
  id?: string;
  onEvents?: Record<string, Function>;
}

const EChart: React.FC<EChartProps> = ({ options, style, className, id, onEvents }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const onEventsRef = useRef(onEvents);

  useEffect(() => {
    onEventsRef.current = onEvents;
  }, [onEvents]);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, null, { renderer: 'canvas' });
      
      // Bind a generic event listener that delegates to the latest onEventsRef
      chartInstance.current.on('click', (params) => {
        if (onEventsRef.current && onEventsRef.current.click) {
          onEventsRef.current.click('click', params);
        }
      });
    }

    if (options) {
      chartInstance.current.setOption(options, { replaceMerge: ["series", "xAxis", "yAxis", "visualMap"] });
    }

    const resizeObserver = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });

    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [options]);

  return <div id={id} ref={chartRef} className={className} style={{ width: '100%', height: '100%', ...style }} />;
};

export default EChart;
