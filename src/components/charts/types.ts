export interface ChartItem {
  id?: string | number
  name: string
  value: number
  subtitle?: string
  tooltip?: string
}

export interface HorizontalBarChartProps {
  data: ChartItem[]
  showRank?: boolean
  noDataMessage?: string
  valueFormatter?: (value: number) => string
}