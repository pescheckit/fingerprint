export class StorageMechanism {
  constructor(name) {
    this.name = name;
  }

  async read() {
    throw new Error('read() must be implemented');
  }

  async write(value) {
    throw new Error('write() must be implemented');
  }

  async isAvailable() {
    throw new Error('isAvailable() must be implemented');
  }
}
