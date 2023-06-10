import Container from './Container';
import ContainerStats from './ContainerStats';

export default class Stats {
  public time: string;
  public containersStats: ContainerStats[] = [];

  public constructor(time: string) {
    this.time = time;
  }

  public addContainerStats = (containerStats: ContainerStats): void => {
    this.containersStats.push(containerStats);
  }

  public getContainerStats = (container: Container): ContainerStats => {
    const containerStats = this.containersStats.find((containerStats: ContainerStats) => containerStats.getContainerName() === container.getName());

    if (!containerStats) {
      return new ContainerStats(this.time, container, {
          Name: container.getName(),
          CPUPerc: '--',
          MemUsage: '--',
          MemPerc: '--',
          NetIO: '--',
          BlockIO: '--',
      });
    }

    return containerStats;
  }

  public getTime = (): string => {
    return this.time;
  }
}