import Device from "../classes/Device";

export default class ChartDot {
  constructor(
    protected device: Device,
    protected name: string,
    protected color: string,
    protected value: number,
    protected read: boolean = false,
    protected write: boolean = false
  ) {
    this.value = this.round(this.value);
  }

  public getDevice = (): Device => this.device;
  public getName = (): string => this.name;
  public getColor = (): string => this.color;
  public getValue = (): number => this.value;
  public isWrite = (): boolean => this.write;
  public isDefault = (): boolean => !this.read && !this.write;
  public hasWriteSibling = (): boolean => this.read && !this.write;

  protected round = (value: number): number => {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}