import Container from "./Container";

export default class ContainersCollection {
  public containers: Container[] = [];

  public addContainer = (container: Container): ContainersCollection => {
    this.containers.push(container);

    return this;
  }

  public hasContainers = (): boolean => this.containers.length > 0;
  public containsContainer = (container: Container): boolean => this.containers.some((c: Container) => c.equals(container));
  public orderByName = (): void => {
    this.containers.sort((a: Container, b: Container) => a.getName().localeCompare(b.getName()));
  }

  public getContainerByName = (name: string): Container => {
    const container = this.containers.find((container: Container) => container.getName() === name);
    if (!container) {
      throw new Error(`Container ${name} not found`);
    }

    return container;
  }

  public getContainerById = (ID: string): Container => {
    const container = this.containers.find((container: Container) => container.getID() === ID);
    if (!container) {
      throw new Error(`Container ${ID} not found`);
    }

    return container;
  }

  public getContainers = (): Container[] => this.containers;

  public forEach = (callback: (container: Container) => void): void => {
    this.containers.forEach((container: Container) => callback(container));
  }

  public map = <T>(callback: (container: Container) => T): T[] => {
    return this.containers.map((container: Container) => callback(container));
  }

  public removeContainerByID(ID: string): ContainersCollection {
    this.containers = this.containers.filter((container: Container) => container.getID() !== ID);

    return this;
  }

  public removeContainersNotIn(collection: ContainersCollection): ContainersCollection {
    this.containers = this.containers.filter((container: Container) => collection.containsContainer(container));

    return this;
  }

  public clone(): ContainersCollection {
    const collection = new ContainersCollection;
    collection.containers = [...this.containers];

    return collection;
  }
}