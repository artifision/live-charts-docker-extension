import RawContainerStats from "../interfaces/RawContainerStats";
import Container from "./Container";

export default class ContainerStats {
  protected time: string;
  protected container: Container;

  public cpu_percent: number;
  public memory_percent: number;
  public memory_usage: number;
  public memory_limit: number;
  public disk_read: number;
  public disk_write: number;
  public network_read: number;
  public network_write: number;

  public constructor(time: string, container: Container, rawContainerStats: RawContainerStats) {
    this.time = time;
    this.container = container;

    this.cpu_percent = this.parsePercent(rawContainerStats.CPUPerc);
    this.memory_percent = this.parsePercent(rawContainerStats.MemPerc);
    [this.memory_usage, this.memory_limit] = this.parseMultiValues(rawContainerStats.MemUsage);
    [this.disk_read, this.disk_write] = this.parseMultiValues(rawContainerStats.BlockIO);
    [this.network_read, this.network_write] = this.parseMultiValues(rawContainerStats.NetIO);
  }

  private parsePercent(value: string): number {
    if (value === '--') {
      return 0;
    }
    return parseFloat(value.split('%')[0]);
  }

  private parseMultiValues(value: string): number[] {
    if (value === '--') {
      return [0, 0];
    }
    return value.split(' / ').map(this.convertToBytes);
  }

  private convertToBytes = (value: string): number => {
    if (value === '--') {
      return 0;
    }
    const [number, unit]: string[] = value.split(/([a-zA-Z]+)/);
    const numberAsFloat: number = parseFloat(number);
    switch (unit) {
      case 'kB':
        return (numberAsFloat * 1000);
      case 'KiB':
        return (numberAsFloat * 1024);
      case 'MB':
        return (numberAsFloat * 1000 * 1000);
      case 'MiB':
        return (numberAsFloat * 1024 * 1024);
      case 'GB':
        return (numberAsFloat * 1000 * 1000 * 1000);
      case 'GiB':
        return (numberAsFloat * 1024 * 1024 * 1024);
      case 'TB':
        return (numberAsFloat * 1000 * 1000 * 1000 * 1000);
      case 'TiB':
        return (numberAsFloat * 1024 * 1024 * 1024 * 1024);
      default:
        return numberAsFloat;
    }
  }

  public getContainerName = (): string => this.container.getName();
  public getContainer = (): Container => this.container;
  public getTime = (): string => this.time;
}