declare module 'react-chartjs-2' {
  import { ChartData, ChartOptions, ChartType } from 'chart.js';
  import { ComponentType } from 'react';

  export interface ChartComponentProps {
    data: ChartData<any>;
    options?: ChartOptions<any>;
    id?: string;
    height?: number;
    width?: number;
    redraw?: boolean;
    type?: ChartType;
    fallbackContent?: string;
  }

  export type ChartComponent = ComponentType<ChartComponentProps>;

  export const Line: ChartComponent;
  export const Bar: ChartComponent;
  export const Doughnut: ChartComponent;
  export const Pie: ChartComponent;
  export const PolarArea: ChartComponent;
  export const Radar: ChartComponent;
  export const Bubble: ChartComponent;
  export const Scatter: ChartComponent;

  export function getDatasetAtEvent(event: any, dataset: any): any;
  export function getElementAtEvent(event: any, dataset: any): any;
  export function getElementsAtEvent(event: any, dataset: any): any;
}
