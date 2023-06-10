import ChartItem from "./ChartItem";
import ChartDot from "./ChartDot";

export default class ChartData {
  public constructor(protected items: ChartItem[]) {
  }

  public hasItems = (): boolean => this.items.length > 0;

  public getData = (): any[] => {
    return this.items.map((item: ChartItem) => {
      const data: any = {
        time: item.getTime(),
      };

      item.getDots().forEach((dot: ChartDot, index: number): void => {
        data[`dot-${index}`] = dot.getValue();
      });

      return data;
    });
  }

  public getDotsSample = (): ChartDot[] => {
    return this.items[0].getDots();
  }

  public getItemByTime = (time: string): ChartItem | undefined => {
    return this.items.find((item: ChartItem): boolean => {
      return item.getTime() === time;
    });
  }

  public getUniqueKey = (): string => {
    const keys = this.getDotsSample().map((dot: ChartDot): string => {
      return `${dot.getDevice().getName()}-${dot.getName()}`;
    });

    return keys.sort().join('-');
  }
}