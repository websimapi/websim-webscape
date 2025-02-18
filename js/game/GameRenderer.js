export class GameRenderer {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
  }

  onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
  }
}