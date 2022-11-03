export default class List<T> {
    public items: Array<T>;

    constructor() {
        this.items = [];
    }

    size(): number {
        return this.items.length;
    }

    add(value: T): void {
        this.items.push(value);
    }

    get(index: number): T {
        return this.items[index];
    }
}