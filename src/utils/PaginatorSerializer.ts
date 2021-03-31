import {RequestContext} from '@loopback/rest';
import {stringify} from 'querystring';

export class PaginatorSerializer<T = any> {
  baseUrl: string;

  constructor(
    public results: T[],
    public count: number,
    public limit: number,
    public offset: number,
  ) {}

  get previous_url(): string | null {
    let previous: string | null = null;
    if (this.offset > 0 && this.count) {
      previous = `${this.baseUrl}?${stringify({
        filter: {
          limit: this.limit,
          ...(this.offset - this.limit >= 0 && {offset: this.offset}),
        },
      })}`;
    }
    return previous;
  }

  get next_url() {
    let next: string | null = null;
    if (this.offset + this.limit < this.count) {
      next = `${this.baseUrl}?${stringify({
        filter: {
          limit: this.limit,
          ...(this.offset >= 0 &&
            this.limit >= 0 && {offset: this.offset + this.limit}),
        },
      })}`;
    }
    return next;
  }

  toJson(req: RequestContext) {
    this.baseUrl = `${req.requestedBaseUrl}${req.request.url}`;
    return {
      results: this.results,
      count: this.count,
      limit: this.limit,
      offset: this.offset,
      previous_url: this.previous_url,
      next_url: this.next_url,
    };
  }
}
