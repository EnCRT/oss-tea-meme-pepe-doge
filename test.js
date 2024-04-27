/* eslint-env mocha */
/* global fetch */
/* eslint-disable no-unused-expressions */

'use strict';

const chai = require('chai');
const fetchMock = require('fetch-mock');
const chaiFetchMock = require('.');

const expect = chai.expect;

before(() => {
  fetchMock
    .get('/cats', {hi: 'hi'})
    .post('/dogs', {bye: 'bye'})
    .get(/\/unicorns\/\d+/, {okay: 'okay'}, {name: 'unicorns'});
  chai.use(chaiFetchMock);
});

describe('route()', () => {
  it('sets an internal flag', () => {
    expect(fetchMock).route('/cats');
  });

  it('does not work on non-fetch-mock objects', () => {
    expect(() => expect({}).route('/cats')).to.throw(Error);
  });

  it('does not work on non-existent routes', () => {
    expect(() => expect(fetchMock).route('/nope')).to.throw(Error);
  });
});

describe('called', () => {
  beforeEach(fetchMock.reset);

  it('passes if a route has been called', () => {
    return fetch('/cats').then(() => {
      expect(() => {
        expect(fetchMock).route('/cats').to.have.been.called;
      }).to.not.throw(Error);
    });
  });

  it('fails if a route has not been called', () => {
    expect(() => {
      expect(fetchMock).route('/cats').to.have.been.called;
    }).to.throw(Error);
  });
});

describe('args()', () => {
  const args = {
    method: 'post',
    body: {
      doggos: true
    }
  };

  beforeEach(fetchMock.reset);

  it('passes if a route was called with arguments', () => {
    return fetch('/dogs', args).then(() => {
      expect(() => {
        expect(fetchMock).route('/dogs').to.have.been.called.with.args(['/dogs', args]);
      }).to.not.throw(Error);
    });
  });

  it('fails if a route does not have exact arguments', () => {
    return fetch('/dogs', Object.assign({}, args, {puppers: true})).then(() => {
      expect(() => {
        expect(fetchMock).route('/dogs').to.have.been.called.with.args(['/dogs', args]);
      }).to.throw(Error);
    });
  });
});

describe('url()', () => {
  beforeEach(fetchMock.reset);

  it('passes if a route was called with a URL', () => {
    return fetch('/unicorns/1').then(() => {
      expect(() => {
        expect(fetchMock).route('unicorns').to.have.been.called.with.url('/unicorns/1');
      }).to.not.throw(Error);
    });
  });

  it('fails if a route was not called with a URL', () => {
    return fetch('/unicorns/1').then(() => {
      expect(() => {
        expect(fetchMock).route('unicorns').to.have.been.called.with.url('/unicorns/2');
      }).to.throw(Error);
    });
  });
});

describe('options()', () => {
  const opts = {method: 'get'};

  beforeEach(fetchMock.reset);

  it('passes if a route was called with options', () => {
    return fetch('/cats', opts).then(() => {
      expect(() => {
        expect(fetchMock).route('/cats').to.have.been.called.with.options(opts);
      }).to.not.throw(Error);
    });
  });

  it('fails if a route does not have exact options', () => {
    return fetch('/cats', opts).then(() => {
      expect(() => {
        expect(fetchMock).route('/cats').to.have.been.called.with.options({});
      }).to.throw(Error);
    });
  });
});
