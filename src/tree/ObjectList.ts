import Element from "./Element";

export interface ListType {
    ref: string | undefined;
    marker?: boolean;
}

/**
 * Manages a list of objects.
 * Objects may be patched. Then, they can be referenced using the 'ref' (string) property.
 */
export default class ObjectList<T extends ListType> {
    private _items: T[];
    private _refs: Record<string, T | undefined>;

    constructor() {
        this._items = [];
        this._refs = {};
    }

    getItems() {
        return this._items;
    }

    get first(): T | undefined {
        return this._items[0];
    }

    get last(): T | undefined {
        return this._items.length ? this._items[this._items.length - 1] : undefined;
    }

    add(item: T, ensureNew = false) {
        this.addAt(item, this._items.length, ensureNew);
    }

    addAt(item: T, index: number, ensureNew = false) {
        if (index >= 0 && index <= this._items.length) {
            let currentIndex = -1;
            if (!ensureNew) {
                currentIndex = this._items.indexOf(item);
                if (currentIndex === index) {
                    return item;
                }
            }

            if (currentIndex !== -1) {
                this.setAt(item, index);
            } else {
                if (item.ref) {
                    this._refs[item.ref] = item;
                }
                this._items.splice(index, 0, item);
                this.onAdd(item, index);
            }
        } else {
            throw new Error("addAt: The index " + index + " is out of bounds " + this._items.length);
        }
    }

    replaceByRef(item: T) {
        if (item.ref) {
            const existingItem = this.getByRef(item.ref);
            if (!existingItem) {
                throw new Error("replaceByRef: no item found with reference: " + item.ref);
            }
            this.replace(item, existingItem);
        } else {
            throw new Error("replaceByRef: no ref specified in item");
        }
        this.addAt(item, this._items.length);
    }

    replace(item: T, prevItem: T) {
        const index = this.getIndex(prevItem);
        if (index === -1) {
            throw new Error("replace: The previous item does not exist");
        }
        this.setAt(item, index);
    }

    setAt(item: T, index: number) {
        if (index >= 0 && index <= this._items.length) {
            const currentIndex = this._items.indexOf(item);
            if (currentIndex !== -1) {
                if (currentIndex !== index) {
                    const fromIndex = currentIndex;
                    if (fromIndex !== index) {
                        this._items.splice(fromIndex, 1);
                        this._items.splice(index, 0, item);
                        this.onMove(item, fromIndex, index);
                    }
                }
            } else {
                if (index < this._items.length) {
                    const ref = this._items[index].ref;
                    if (ref) {
                        this._refs[ref] = undefined;
                    }
                }

                const prevItem = this._items[index];

                // Doesn't exist yet: overwrite current.
                this._items[index] = item;

                if (item.ref) {
                    this._refs[item.ref] = item;
                }

                this.onSet(item, index, prevItem);
            }
        } else {
            throw new Error("setAt: The index " + index + " is out of bounds " + this._items.length);
        }
    }

    getAt(index: number) {
        return this._items[index];
    }

    getIndex(item: T) {
        return this._items.indexOf(item);
    }

    remove(item: T) {
        const index = this._items.indexOf(item);

        if (index !== -1) {
            this.removeAt(index);
        }
    }

    removeAt(index: number) {
        const item = this.removeSilently(index);

        this.onRemove(item, index);

        return item;
    }

    protected removeSilently(index: number): T {
        const item = this._items[index];

        if (item.ref) {
            this._refs[item.ref] = undefined;
        }

        this._items.splice(index, 1);

        return item;
    }

    clear() {
        const n = this._items.length;
        if (n) {
            const prev = this._items;
            this._items = [];
            this._refs = {};
            this.onSync(prev, [], []);
        }
    }

    get length() {
        return this._items.length;
    }

    getRefs() {
        return this._refs;
    }

    getByRef(ref: string) {
        return this._refs[ref];
    }

    clearRef(ref: string) {
        delete this._refs[ref];
    }

    setRef(ref: string, child: T) {
        this._refs[ref] = child;
    }

    setItems(newItems: T[]) {
        const prevItems = this._items;
        this._items = newItems;

        // Remove the items.
        const removed = prevItems.filter(item => {
            const m = item.marker;
            delete item.marker;
            return m;
        });
        const added = newItems.filter(item => prevItems.indexOf(item) === -1);

        if (removed.length || added.length) {
            // Recalculate refs.
            this._refs = {};
            for (let i = 0, n = this._items.length; i < n; i++) {
                const ref = this._items[i].ref;
                if (ref) {
                    this._refs[ref] = this._items[i];
                }
            }
        }

        this.onSync(removed, added, newItems);
    }

    sort(f: (a: T, b: T) => number) {
        const items = this._items.slice();
        items.sort(f);
        this.onSync([], [], items);
    }

    protected onAdd(item: T, index: number) {}

    protected onRemove(item: T, index: number) {}

    protected onSync(removed: T[], added: T[], order: T[]) {}

    protected onSet(item: T, index: number, prevItem: T) {}

    protected onMove(item: T, fromIndex: number, toIndex: number) {}
}