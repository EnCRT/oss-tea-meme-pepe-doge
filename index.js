'use strict';

/**
 * Creates BDD assertions for use with Chai and fetch-mock.
 * @param {Chai} chai - Chai instance.
 * @param {Object} utils - Chai utilities.
 */
module.exports = (chai, utils) => {
  const Assertion = chai.Assertion;

  /**
   * Create a factory function for use with Chai's `overwriteMethod` and `overwriteProperty`
   * functions. The plugin's assertions only kick in if the assertion started with a call to
   * `route()`. This prevents conflicts with other Chai plugins from happening.
   */
  function withFlagCheck(callback) {
    return function (_super) {
      return function (...args) {
        const route = utils.flag(this, 'fetchMock');

        if (route) {
          // Use a chai-fetch-mock method/property if a route has been set in the assertion chain
          callback.call(this, route, ...args);
        } else {
          // Otherwise, fall back to a method/property with the same name if it exists
          _super.call(this, ...args);
        }
      };
    };
  }

  /**
   * Enables use of fetch-mock assertions farther down the chain.
   * @param {String} str - Route to examine.
   * @throws {AssertionError} A fetch-mock object is not being examined.
   * @throws {AssertionError} The given route doesn't exist on the fetch-mock object.
   */
  Assertion.addMethod('route', function (str) {
    // Check if the object is fetch-mock
    new Assertion(this._obj, `Expected ${this._obj} to be a fetch-mock object`).include.any.keys(['fetchMock', 'realFetch']);

    // Check if the route exists
    const routes = this._obj.routes.map(r => r.name);
    new Assertion(str, `Expected ${str} to be a fetch-mock route`).oneOf(routes);

    // Store the matcher as a flag
    utils.flag(this, 'fetchMock', str);
  });

  /**
   * Check if a route has been called at least once.
   * @throws {AssertionError} A route to test was not set with the `route()` function.
   */
  Assertion.overwriteProperty('called', withFlagCheck(function (route) {
    this.assert(
      this._obj.called(route) === true,
      `Expected route "${route}" to have been called`,
      `Expected route "${route}" to not have been called`
    );
  }));

  /**
   * Check if a call to `fetch()` to a specific route was made with specific arguments.
   * @param {Array} args - Arguments to check.
   * @throws {AssertionError} A route to test was not set with the `route()` function.
   */
  Assertion.overwriteMethod('args', withFlagCheck(function (route, args) {
    const lastArgs = this._obj.lastCall(route);

    new Assertion(lastArgs).eql(args);
  }));

  /**
   * Check if a call to `fetch()` to a specific route was made with a specific URL.
   * @param {Array} url - URL to check.
   * @throws {AssertionError} A route to test was not set with the `route()` function.
   */
  Assertion.overwriteMethod('url', withFlagCheck(function (route, url) {
    const lastUrl = this._obj.lastUrl(route);

    this.assert(
      lastUrl === url,
      `Expected route "${route}" to have been called with URL ${url}`,
      `Expected route "${route}" to not have been called with URL ${url}`,
      url,
      lastUrl
    );
  }));

  /**
   * Check if a call to `fetch()` to a specific route was made with specific options.
   * @param {Array} opts - Options to check.
   * @throws {AssertionError} A route to test was not set with the `route()` function.
   */
  Assertion.overwriteMethod('options', withFlagCheck(function (route, opts) {
    const lastOpts = this._obj.lastOptions(route);

    new Assertion(lastOpts).eql(opts);
  }));
};
