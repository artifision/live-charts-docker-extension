import ContainerStats from "./ContainerStats";
import ChartItem from "./ChartItem";
import ChartDot from "./ChartDot";
import Stats from "./Stats";
import ContainersCollection from "./ContainersCollection";
import Container from "./Container";

export default class Device {
  protected useContainerColors: boolean = false;

  public constructor(
    protected name: string,
    protected key: string,
    protected unit: string,
    protected color: string,
  ) {
  }

  public getName = (): string => this.name;
  public getUnit = (): string => this.unit;
  public getKey = (): string => this.key;
  public isCpu = (): boolean => this.key === 'cpu';
  public isMemory = (): boolean => this.key === 'memory';
  public isDisk = (): boolean => this.key === 'disk';
  public isNetwork = (): boolean => this.key === 'network';
  public getColor = (): string => this.color;
  public tooltipTitle = (): string => {
    if (this.isNetwork() || this.isDisk()) {
      return `${this.name} (read / write)`;
    }

    return this.name;
  }

  public setUseContainerColor = (use: boolean): void => {
    this.useContainerColors = use;
  };

  protected makeChartDots = (containerStats: ContainerStats): ChartDot[] => {
    if (this.isCpu() || this.isMemory()) {
      return [new ChartDot(
        this,
        containerStats.getContainer().getName(),
        this.useContainerColors ? containerStats.getContainer().getColor() : this.getColor(),
        this.key === 'cpu' ? containerStats.cpu_percent : this.convertFromBytesToSelectedUnit(containerStats.memory_usage)
      )];
    }

    const dots: ChartDot[] = [];

    if (this.isNetwork() || this.isDisk()) {
      let value_read: number = this.key === 'disk' ? containerStats.disk_read : containerStats.network_read;
      value_read = this.convertFromBytesToSelectedUnit(value_read);

      dots.push(new ChartDot(
        this,
        containerStats.getContainer().getName(),
        this.useContainerColors ? containerStats.getContainer().getColor() : this.getColor(),
        value_read,
        true
      ));

      let value_write: number = this.key === 'disk' ? containerStats.disk_write : containerStats.network_write;
      value_write = this.convertFromBytesToSelectedUnit(value_write);
      value_write = -value_write;

      dots.push(new ChartDot(
        this,
        containerStats.getContainer().getName(),
        this.useContainerColors ? containerStats.getContainer().getColor() : this.getColor(),
        value_write,
        false,
        true
      ));
    }

    return dots;
  }

  public makeOverviewChartItem(stats: Stats, containers: ContainersCollection): ChartItem {
    const chartItem: ChartItem = this.makeCombinedChartItem(stats, containers);

    chartItem.mergeDots();

    return chartItem;
  }

  public makeCombinedChartItem = (stats: Stats, containers: ContainersCollection): ChartItem => {
    const chartItem: ChartItem = new ChartItem(stats.getTime());

    containers.forEach((container: Container) => {
      const containerStats: ContainerStats = stats.getContainerStats(container);
      const dots: ChartDot[] = this.makeChartDots(containerStats);

      dots.forEach((dot: ChartDot) => chartItem.addDot(dot));
    })

    return chartItem;
  }

  public makeSplitChartItem = (containerStats: ContainerStats): ChartItem => {
    const chartItem: ChartItem = new ChartItem(containerStats.getTime());

    this.makeChartDots(containerStats).forEach((dot: ChartDot) => chartItem.addDot(dot));

    return chartItem;
  }

  protected convertFromBytesToSelectedUnit = (value: number): number => {
    switch (this.unit) {
      case 'B':
        return value;
      case 'kB':
        return value / 1000;
      case 'MB':
        return value / 1000000;
      case 'GB':
        return value / 1000000000;
      default:
        throw new Error(`Unknown unit: ${this.unit}`);
    }
  }
}