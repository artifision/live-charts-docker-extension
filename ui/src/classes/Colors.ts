export default class Colors {
  protected palette: string[] = [];
  protected used: string[] = [];

  protected lightPalette: string[] = [
    '#6fbf73',
    '#ea605d',
    '#64ffda',
    '#ff9800',
    '#a6d4fa',
    '#f2aeae',
    '#2196f3',
    '#ffb74d',
    '#4db6ac',
    '#e040fb',
    '#ffd699',
    '#536dfe',
    '#ffeb3b',
    '#4caf50',
    '#f44336',
    '#b7deb8',
    '#4dabf5',
    '#18ffff',
    '#9fa8da',
    '#ea80fc',
  ];

  protected darkPalette: string[] = [
    '#2e7d32',
    '#e53935',
    '#00acc1',
    '#af52bf',
    '#af6200',
    '#5e35b1',
    '#c62828',
    '#795548',
    '#2196f3',
    '#4caf50',
    '#6e6d19',
    '#fb8c00',
    '#7c88cc',
    '#1c54b2',
    '#33877c',
    '#8f9a27',
  ];

  public setUseLightPalette(useLightPalette: boolean): this {
    this.palette = useLightPalette ? this.lightPalette : this.darkPalette;

    return this;
  }

  public pop(): string {
    if (this.used.length === 0) {
      this.used = [...this.palette];
    }

    return this.used.shift() || 'inherit';
  }

  public reset(): this {
    this.used = [];

    return this;
  }

  public shuffle(): this {
    for (let i = this.palette.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.palette[i], this.palette[j]] = [this.palette[j], this.palette[i]];
    }

    return this;
  }
}