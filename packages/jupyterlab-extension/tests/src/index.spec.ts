// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Add any needed widget imports here (or from controls)
// import {} from '@jupyter-widgets/base';

import expect = require('expect.js');

import {
  createTestModel
} from './utils.spec';

import { BabylonJSModel } from '../../src';


describe('BabylonJS', () => {

  describe('BabylonJSModel', () => {

    it('should be createable', () => {
      let model = createTestModel(BabylonJSModel);
      expect(model).to.be.an(BabylonJSModel);
      expect(model.get('value')).to.be('Hello World');
    });

    it('should be createable with a value', () => {
      let state = { value: 'Foo Bar!' }
      let model = createTestModel(BabylonJSModel, state);
      expect(model).to.be.an(BabylonJSModel);
      expect(model.get('value')).to.be('Foo Bar!');
    });

  });

});
