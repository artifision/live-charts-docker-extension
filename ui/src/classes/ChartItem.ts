import ChartDot from "./ChartDot";
import Device from "./Device";

export default class ChartItem {
  protected dots: ChartDot[] = [];

  public constructor(protected time: string) {
  }

  public getTime = (): string => this.time;
  public getDots = (): ChartDot[] => this.dots;
  public getDevice = (): Device => this.dots[0].getDevice();

  public addDot = (dot: ChartDot): void => {
    this.dots.push(dot);

    this.dots.sort((a: ChartDot, b: ChartDot): number => b.getValue() - a.getValue());
  }

  public getWriteSibling = (dot: ChartDot): ChartDot | null => {
    for (const sibling of this.dots) {
      if (sibling.isWrite() && sibling.getDevice() === dot.getDevice() && dot.getName() === sibling.getName()) {
        return sibling;
      }
    }

    return null;
  }

  public mergeDots = (): void => {
    const defaultDots: ChartDot[] = [];
    const readDots: ChartDot[] = [];
    const writeDots: ChartDot[] = [];

    for (const dot of this.dots) {
      if (dot.isDefault()) {
        defaultDots.push(dot);
      } else if (dot.isWrite()) {
        writeDots.push(dot);
      } else {
        readDots.push(dot);
      }
    }

    if (defaultDots.length) {
      const defaultDot = new ChartDot(
        defaultDots[0].getDevice(),
        `${defaultDots[0].getDevice().getName()} total`,
        defaultDots[0].getDevice().getColor(),
        defaultDots.reduce((sum: number, dot: ChartDot): number => sum + dot.getValue(), 0),
      )
      this.dots = [defaultDot];
    } else if (readDots.length && writeDots.length) {
      const readDot = new ChartDot(
        readDots[0].getDevice(),
        `${readDots[0].getDevice().getName()} total`,
        readDots[0].getDevice().getColor(),
        readDots.reduce((sum: number, dot: ChartDot): number => sum + dot.getValue(), 0),
        true
      )

      const writeDot = new ChartDot(
        writeDots[0].getDevice(),
        `${writeDots[0].getDevice().getName()} total`,
        writeDots[0].getDevice().getColor(),
        writeDots.reduce((sum: number, dot: ChartDot): number => sum + dot.getValue(), 0),
        false,
        true
      );

      this.dots = [readDot, writeDot];
    }
  }
}