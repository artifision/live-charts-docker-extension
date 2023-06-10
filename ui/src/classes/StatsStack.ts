import Stats from "./Stats";

export default class StatsStack {
  public stats: Stats[] = [];

  public constructor(protected maxStackSize: number) {

  }

  public addStats = (stats: Stats): StatsStack => {
    if (this.stats.length >= this.maxStackSize) {
      this.stats.shift();
    }
    this.stats.push(stats);

    return this;
  }

  public addUniqueStats = (stats: Stats): StatsStack => {
    if (this.stats.find((existingStats: Stats): boolean => existingStats.getTime() === stats.getTime())) {
      return this;
    }
    return this.addStats(stats);
  }

  public getStats = (): Stats[] => this.stats;

  public clone = (): StatsStack => {
    const statsStack: StatsStack = new StatsStack(this.maxStackSize);
    statsStack.stats = this.stats;

    return statsStack;
  }
}