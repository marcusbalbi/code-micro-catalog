import {inject, Provider} from '@loopback/context';
import {OperationRetval, RequestContext, Response, Send} from '@loopback/rest';
import {PaginatorSerializer} from '../utils/PaginatorSerializer';

export class ApiResourceProvider implements Provider<Send> {
  constructor(@inject.context() public request: RequestContext) {}
  value() {
    return (response: Response, result: OperationRetval) => {
      if (result) {
        response.json(
          result instanceof PaginatorSerializer
            ? result.toJson(this.request)
            : result,
        );
      }
      response.end();
    };
  }
}
