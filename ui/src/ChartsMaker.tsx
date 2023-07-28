import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {blueGrey, red} from '@mui/material/colors';
import {Stack, useTheme} from "@mui/material";
import ChartData from "./classes/ChartData";
import ChartDot from "./classes/ChartDot";
import Device from "./classes/Device";

type CustomTooltipProps = {
  active?: boolean,
  payload?: any[],
  chartData: ChartData
}

const CustomTooltip = ({active, payload, chartData}: CustomTooltipProps) => {
  const theme = useTheme();
  if (active && payload && payload.length) {
    const chartItem = chartData.getItemByTime(payload[0].payload.time);
    if (!chartItem) {
      return null;
    }
    const device = chartItem.getDevice();
    return (
      <Stack sx={{
        padding: 1,
        backgroundColor: theme.palette.mode === 'dark' ? blueGrey[800] : blueGrey[50],
        color: theme.palette.mode === 'dark' ? blueGrey[50] : blueGrey[900],
        border: 1,
        borderColor: blueGrey[900],
        borderRadius: 1,
        boxShadow: 24
      }}
      >
        <b color={device.getColor()}>{device.tooltipTitle()}</b>
        {chartItem.getDots().map((dot: ChartDot, index: number) => {
          if (dot.isWrite()) {
            return null;
          }
          if (dot.hasWriteSibling()) {
            const writeSibling: ChartDot | null = chartItem.getWriteSibling(dot);
            if (!writeSibling) {
              return null;
            }
            return (
              <Stack key={index} direction="row" justifyContent="space-between">
                <b style={{color: dot.getColor()}}>{dot.getName()}:&nbsp;</b>
                <span>{`${dot.getValue()} ${dot.getDevice().getUnit()} / ${-writeSibling.getValue()} ${writeSibling.getDevice().getUnit()}`}</span>
              </Stack>
            )
          }
          return (
            <Stack key={index} direction="row" justifyContent="space-between">
              <b style={{color: dot.getColor()}}>{dot.getName()}:&nbsp;</b>
              <span>{`${dot.getValue()} ${dot.getDevice().getUnit()}`}</span>
            </Stack>
          )
        })}
      </Stack>
    );
  }

  return null;
};

export default class ChartsMaker {
  public charts: Object[] = [];

  public getCharts = (): Object[] => this.charts;

  public addChart(device: Device, chartData: ChartData): void {
    let chart: JSX.Element;
    const data: any[] = chartData.getData();
    if (device.isCpu() || device.isMemory()) {
      chart = <AreaChart data={data} syncId="sync-all">
        <CartesianGrid strokeDasharray="3 3"/>
        <XAxis dataKey="time"/>
        <YAxis/>
        <Tooltip wrapperStyle={{zIndex: 1000}} content={<CustomTooltip chartData={chartData}/>}/>
        {chartData.getDotsSample().map((dot: ChartDot, index: number) => {
          return <Area key={dot.getKey()} type="monotone" dataKey={dot.getKey()}
                       stroke={dot.getColor()} fill={dot.getColor()}
                       isAnimationActive={false} dot={false}/>
        })}

      </AreaChart>;
    } else if (device.isNetwork() || device.isDisk()) {
      chart = <AreaChart data={data} syncId="sync-all">
        <CartesianGrid strokeDasharray="3 3"/>
        <XAxis dataKey="time"/>
        <YAxis tickFormatter={(value: number): string => `${Math.abs(value)}`}/>
        <Tooltip wrapperStyle={{zIndex: 1000}} content={<CustomTooltip chartData={chartData}/>}/>
        {chartData.getDotsSample().map((dot: ChartDot) => {
          return <Area key={dot.getKey()} type="monotone" dataKey={dot.getKey()}
                       stroke={dot.getColor()} fill={dot.getColor()}
                       isAnimationActive={false} dot={false}/>
        })}
        <ReferenceLine y={0} stroke={red[900]}/>
      </AreaChart>;
    } else {
      throw new Error(`Unknown stats type: ${device.getKey()}`);
    }

    this.charts.push({
      key: chartData.getUniqueKey(),
      chart: <ResponsiveContainer width="100%" height="100%">{chart}</ResponsiveContainer>
    });
  }

  public addCombinedChart(device: Device, chartData: ChartData): void {
    let chart: JSX.Element;
    const data: any[] = chartData.getData();
    if (device.isCpu() || device.isMemory()) {
      chart = <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3"/>
        <XAxis dataKey="time"/>
        <YAxis/>
        <Tooltip wrapperStyle={{zIndex: 1000}} content={<CustomTooltip chartData={chartData}/>}/>
        {chartData.getDotsSample().map((dot: ChartDot, index: number) => {
          return <Line key={dot.getKey()} type="monotone" dataKey={dot.getKey()}
                       stroke={dot.getColor()} fill={dot.getColor()}
                       isAnimationActive={false} dot={false}/>
        })}
      </LineChart>
    } else if (device.isNetwork() || device.isDisk()) {
      chart = <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3"/>
        <XAxis dataKey="time"/>
        <YAxis tickFormatter={(value: number): string => `${Math.abs(value)}`}/>
        <Tooltip wrapperStyle={{zIndex: 1000}} content={<CustomTooltip chartData={chartData}/>}/>
        {chartData.getDotsSample().map((dot: ChartDot, index: number) => {
          return <Line key={dot.getKey()} type="monotone" dataKey={dot.getKey()}
                       stroke={dot.getColor()} fill={dot.getColor()}
                       isAnimationActive={false} dot={false}/>
        })}
        <ReferenceLine y={0} stroke={red[900]}/>
      </LineChart>;
    } else {
      throw new Error(`Unknown stats type: ${device.getKey()}`);
    }

    this.charts.push({
      key: `${device.getName()}`,
      chart: <ResponsiveContainer width="100%" height="100%">{chart}</ResponsiveContainer>
    });
  }
}