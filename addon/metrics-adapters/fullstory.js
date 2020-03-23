import { assign } from '@ember/polyfills';
import { assert } from '@ember/debug';
import { get } from '@ember/object';
import objectTransforms from '../utils/object-transforms';
import removeFromDOM from '../utils/remove-from-dom';
import BaseAdapter from './base';

const {
  compact,
  without,
} = objectTransforms;

export default BaseAdapter.extend({
  toStringExtension() {
    return 'Fullstory';
  },

  init() {
    const { org, debug } = get(this, 'config');

    assert(`[ember-metrics] You must pass a valid \`org\` to the ${this.toString()} adapter`, org);

    /* eslint-disable */
    window['_fs_org'] = org;
    window['_fs_debug'] = debug;
    window['_fs_namespace'] = 'FS';
    window['_fs_host'] = 'fullstory.com';
    window['_fs_script'] = 'edge.fullstory.com/s/fs.js';

    (function(m,n,e,t,l,o,g,y){
        if (e in m) {if(m.console && m.console.log) { m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].');} return;}
        g=m[e]=function(a,b,s){g.q?g.q.push([a,b,s]):g._api(a,b,s);};g.q=[];
        o=n.createElement(t);o.async=1;o.crossOrigin='anonymous';o.src='https://'+_fs_script;
        y=n.getElementsByTagName(t)[0];y.parentNode.insertBefore(o,y);
        g.identify=function(i,v,s){g(l,{uid:i},s);if(v)g(l,v,s)};
        g.setUserVars=function(v,s){g(l,v,s)};
        g.event=function(i,v,s){g('event',{n:i,p:v},s)};
        g.anonymize=function(){g.identify(!!0)};
        g.shutdown=function(){g("rec",!1)};
        g.restart=function(){g("rec",!0)};
        g.log=function(a,b){g("log",[a,b])};
        g.consent=function(a){g("consent",!arguments.length||a)};
        g.identifyAccount=function(i,v){o='account';v=v||{};v.acctId=i;g(o,v)};
        g.clearUserCookie=function(){};
        g._w={};y='XMLHttpRequest';g._w[y]=m[y];y='fetch';
        g._w[y]=m[y];
        if(m[y])m[y]=function(){return g._w[y].apply(this,arguments)};
        g._v="1.2.0";
    })(window,document,window['_fs_namespace'],'script','user');
    /* eslint-enable */
  },

  identify(options = {}) {
    const compactedOptions = compact(options);
    const { distinctId } = compactedOptions;
    const props = without(compactedOptions, 'distinctId');

    window.FS.identify(distinctId, props);
  },

  trackEvent(options = {}) {
    const compactedOptions = compact(options);
    const { event } = compactedOptions;
    const props = without(compactedOptions, 'event');

    window.FS.event(name, props);
    return event;
  },

  trackPage(options = {}) {
    const event = { event: 'pageview' };
    const mergedOptions = assign(event, options);

    this.trackEvent(mergedOptions);
  },

  logout() {
    window.FS.identify(false);
  },

  willDestroy() {
    removeFromDOM('script[src*="fullstory"]');
    delete window.FS;
  }
});
