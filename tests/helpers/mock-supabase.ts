// Lightweight in-memory mocks for Supabase queries used by handlers
// Emulates chaining behavior enough for our tests

type Row = Record<string, any>;

class Table {
  private rows: Row[] = [];
  private seq = 1;
  constructor(initial: Row[] = []) { this.rows = initial.map(r => ({ ...r })); }
  public insert(row: Row) {
    const withId = row.id ? { ...row } : { id: `id_${this.seq++}`, ...row };
    this.rows.push(withId);
    return withId;
  }
  public upsert(matchKey: string, row: Row) {
    const idx = this.rows.findIndex(r => r[matchKey] === row[matchKey]);
    if (idx >= 0) this.rows[idx] = { ...this.rows[idx], ...row }; else this.rows.push({ ...row });
  }
  public update(match: (r: Row) => boolean, patch: Row) {
    this.rows = this.rows.map(r => (match(r) ? { ...r, ...patch } : r));
  }
  public delete(match: (r: Row) => boolean) { this.rows = this.rows.filter(r => !match(r)); }
  public find(match: (r: Row) => boolean) { return this.rows.filter(match); }
  public all() { return this.rows.map(r => ({ ...r })); }
}

export class MockDb {
  public users = new Table();
  public wishlist_items = new Table();
  public coupons = new Table();
  public user_coupons = new Table();
  public coupon_shares = new Table();
  public businesses = new Table();
  public business_follows = new Table();
  public storefronts = new Table();
  public storefront_products = new Table();
  public business_reviews = new Table();
  public platform_config = new Table();
  public notifications = new Table();
  public ads = new Table();
  public user_activities = new Table();
}

function builder(table: Table) {
  const state: any = { _filters: [] as Array<(r: Row) => boolean>, _op: 'select', _patch: null, _last: null };
  const api: any = {
    select(_cols?: string) { state._op = state._op === 'insert' ? 'insertSelect' : 'select'; return api; },
    insert(row: Row | Row[]) {
      const rows = Array.isArray(row) ? row : [row];
      const inserted = rows.map((r) => table.insert(r));
      state._op = 'insert';
      state._last = inserted[0] || null;
      return api;
    },
    update(patch: Row) { state._op = 'update'; state._patch = patch; return api; },
    delete() { state._op = 'delete'; return api; },
    upsert(row: Row, opts?: { onConflict?: string }) {
      const key = opts?.onConflict || 'id';
      table.upsert(key, row);
      return Promise.resolve({ data: null, error: null });
    },
    eq(field: string, value: any) { state._filters.push((r: Row) => r[field] === value); return api; },
    gte(field: string, value: any) {
      state._filters.push((r: Row) => {
        const v = (r as any)[field];
        return v !== undefined && v !== null && v >= value;
      });
      return api;
    },
    is(field: string, value: any) { state._filters.push((r: Row) => r[field] === value); return api; },
    order(field: string, opts?: { ascending?: boolean }) {
      // For simplicity, we ignore ordering in mock select results; tests focus on presence not order
      return api;
    },
    range(_from?: number, _to?: number) { return api; },
    limit(_n?: number) { return api; },
    maybeSingle() {
      const rows = table.find((r) => state._filters.every((f: any) => f(r)));
      return Promise.resolve({ data: rows[0] || null, error: null });
    },
    single() {
      if (state._op === 'insert' || state._op === 'insertSelect') {
        return Promise.resolve({ data: state._last, error: null });
      }
      const rows = table.find((r) => state._filters.every((f: any) => f(r)));
      if (!rows[0]) return Promise.resolve({ data: null, error: { message: 'not found' } });
      return Promise.resolve({ data: rows[0], error: null });
    },
    then(onFulfilled: any, onRejected: any) {
      try {
        if (state._op === 'select') {
          const rows = table.find((r) => state._filters.every((f: any) => f(r)));
          return Promise.resolve({ data: rows, error: null }).then(onFulfilled, onRejected);
        }
        if (state._op === 'insertSelect') {
          return Promise.resolve({ data: state._last ? [state._last] : [], error: null }).then(onFulfilled, onRejected);
        }
        if (state._op === 'update') {
          table.update((r) => state._filters.every((f: any) => f(r)), state._patch || {});
          return Promise.resolve({ data: null, error: null }).then(onFulfilled, onRejected);
        }
        if (state._op === 'delete') {
          table.delete((r) => state._filters.every((f: any) => f(r)));
          return Promise.resolve({ data: null, error: null }).then(onFulfilled, onRejected);
        }
        return Promise.resolve({ data: null, error: null }).then(onFulfilled, onRejected);
      } catch (e) {
        return Promise.reject(e).then(onFulfilled, onRejected);
      }
    },
  };
  return api;
}

export function createMockSupabase(db: MockDb) {
  return {
    from(tableName: keyof MockDb) {
      const table = db[tableName] as unknown as Table;
      return builder(table);
    },
  } as any;
}


