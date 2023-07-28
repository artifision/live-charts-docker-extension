export default class Container {
  public constructor(protected ID: string, protected Names: string, protected Color: string) {
  }

  public getName = (): string => this.Names;
  public getID = (): string => this.ID;
  public getColor = (): string => this.Color;

  public equals = (container: Container): boolean => this.getID() === container.getID();

  public setColor(color: string): void {
    this.Color = color;
  }
}