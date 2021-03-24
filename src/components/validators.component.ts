import {Binding, Component} from '@loopback/core';
import {RestTags} from '@loopback/rest';

export class ValidatorsComponent implements Component {
  bindings: Array<Binding> = [];

  constructor() {
    this.bindings = this.validators();
  }

  validators() {
    return [
      Binding.bind('ajv.keywords.exists')
        .to({
          name: 'exists',
          validate: () => {},
        })
        .tag(RestTags.AJV_KEYWORD),
    ];
  }
}
