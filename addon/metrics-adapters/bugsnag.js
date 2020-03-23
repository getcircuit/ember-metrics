import { assert } from '@ember/debug';
import { get, set } from '@ember/object';
import objectTransforms from '../utils/object-transforms';
import removeFromDOM from '../utils/remove-from-dom';
import BaseAdapter from './base';

import { capitalize } from '@ember/string';
import { inject } from '@ember/service';
import { appVersion as getAppVersion } from 'ember-cli-app-version/helpers/app-version';

const {
  compact,
  without,
} = objectTransforms;

export default BaseAdapter.extend({
  router: inject(),
  bugsnagClient: null,

  toStringExtension() {
    return 'Bugsnag';
  },

  init() {
    const { apiKey, debug, releaseStage } = get(this, 'config');

    assert(`[ember-metrics] You must pass a valid \`apiKey\` to the ${this.toString()} adapter`, apiKey);

    /* eslint-disable */
    (function(b,u,g,s,n,a,_g) {
        b[n] = b[n] || console.log('Initializing Bugsnag');
        a = u.createElement(g);
        _g = u.getElementsByTagName(g)[0];
        a.async = 1;
        a.src = s;
        _g.parentNode.insertBefore(a, _g)
    })(window, document, 'script', `https://d2wy8f7a9ursnm.cloudfront.net/v6/bugsnag.${debug ? '' : 'min'}.js`, 'bugsnag');
    /* eslint-enable */


    const router = get(this, 'router._router');
    const appVersion = getAppVersion();

    const bugsnagClient = window.bugsnag({
      releaseStage,
      appVersion,
      apiKey
    });

    set(this, 'bugsnagClient', bugsnagClient);

    window.Ember.onerror = (error) => this._onError(error, router);
    router.didTransition = this._didTransition(router);
  },

  _didTransition(router) {
    const bugsnagClient = set(this, 'bugsnagClient');
    const originalDidTransition = router.didTransition || function () {};

    return function () {
      bugsnagClient.refresh();
      return originalDidTransition.apply(this, arguments);
    };
  },

  _onError(error, router, options = {}) {
    console.error('[ember-metrics] Ember Error:\n', error); // eslint-disable-line

    const bugsnagClient = set(this, 'bugsnagClient');
    const routeContext = this._getRouteContext(router);
    const message = typeof error === 'object' ? error.message : error;

    bugsnagClient.context = routeContext;
    bugsnagClient.notify(message || error, Object.assign({ metaData: { error } }, options));
  },

  _getRouteContext(router) {
    const infos = router.currentState.routerJsState.handlerInfos;

    const url = get(router, 'location').getURL();
    const routeName = infos[infos.length - 1].name;

    const firstSegments = routeName.replace('.index', '').replace(/\./g, ' ');
    const prettyRouteName = capitalize(firstSegments);

    return `${prettyRouteName} (${routeName}, ${url})`;
  },

  identify(options = {}) {
    const compactedOptions = compact(options);
    const { distinctId } = compactedOptions;
    const props = without(compactedOptions, 'distinctId');

    const bugsnagClient = get(this, 'bugsnagClient');

    props.id = props.id || distinctId;
    bugsnagClient.user = props;
  },

  trackEvent(options = {}) {
  },

  trackPage(options = {}) {

  },

  logout() {
    this.bugsnagClient.user = null;
  },

  willDestroy() {
    removeFromDOM('script[src*="bugsnag"]');
    delete window.bugsnag;
  }
});
