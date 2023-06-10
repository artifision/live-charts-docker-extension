export default class Container {
  public ID: string;
  public Names: string;

  public constructor(ID: string, Names: string) {
    this.ID = ID;
    this.Names = Names;
  }

  public getName = (): string => this.Names;
  public getID = (): string => this.ID;

  public equals = (container: Container): boolean => this.getID() === container.getID();
}