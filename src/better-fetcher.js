const {
  handleResponse,
  handleNetworkResponse,
  handleCacheResponse
} = require("./responseHandler");

const {
  checkValidType,
  checkIfValidCredentials,
  createUrl,
  timeoutPromise,
  checkDefaults,
  prepareData,
  mergeObjects
} = require("./utils");

var exports = (module.exports = {});
var cacheName = "";
var defaultHeaders = {
  GET: {},
  POST: {},
  PUT: {},
  DELETE: {},
  ALL: {}
};
var defaultOptions = {
  timeout: 5000,
  init: { credentials: "same-origin" },
  dataType: "auto"
};

exports.setCacheName = function(name) {
  cacheName = name;
};

exports.getCacheName = function() {
  return cacheName;
};

exports.setDefaultHeaders = function(headers, type) {
  defaultHeaders[type] = headers;
};

exports.getDefaultHeaders = function(type) {
  return defaultHeaders[type];
};

exports.setDefaultOptions = function(options) {
  verifyOptions(options);
  defaultOptions = mergeObjects(options, defaultOptions);
};

/*
url:
Set to the destination that you want to fetch data from.
options:
matchAll - Set flag true to match all responses in the cache instead of first hit
dataType - Types include: "json", "blob", "formData", "arrayBuffer", "text", "raw"
init - Pass through init object to fetch call manually.
timeout - timeout (in ms) to set on the api call.
handleCachedResponse - Manually specify a function to be used only for returned cached data.
handleNetworkResponse - Manually specify a function to be used only for returned network data.
useCache - Flag to check cache and return
params - query parameters to pass in
callback:
The function to be called with data as it is received. Expect this function to be called multiple times given that it will likely first be called with cache data and then called with updated network data. 
Do not rely on it being called twice however given that it won't be called a second time if network data returns first or cache data does not exist
*/
exports.get = function(url, options = defaultOptions, callback) {
  if (url === undefined) {
    return Promise.reject(new Error("Missing url parameter in get request"));
  }
  if (options.mock) {
    return options.mock;
  }

  options = checkDefaults(options, "GET", defaultOptions, defaultHeaders);
  if (options.dataType && !checkValidType(options.dataType))
    return Promise.reject(new Error("Invalid data type"));
  url = createUrl(url, options);
  options.url = url;

  // fetch fresh data
  var networkCall = timeoutPromise(options.timeout, fetch(url, options.init))
    .then(function(response) {
      return handleResponse(response, options.validator);
    })
    .then(function(response) {
      return handleNetworkResponse(response, options, callback);
    });

  // fetch cached data
  if (options.useLocalData instanceof Function)
    callback(options.useLocalData(new Request(url, options.init)));
  else if (options.useCache)
    checkCaches(url, options, callback).catch(function() {
      //Don't throw error on cache miss since this is expected behavior
    });

  return networkCall;
};

/*
options:
init - init to pass through to fetch
Takes in a string or a json object to stringify.
*/
exports.post = function(url, data, options = defaultOptions) {
  options = prepareData(data, options, "POST", defaultOptions, defaultHeaders);

  return timeoutFetch(url, options);
};

/*
options:
init - init to pass through to fetch
*/
exports.put = function(url, data, options = defaultOptions) {
  options = prepareData(data, options, "PUT", defaultOptions, defaultHeaders);

  return timeoutFetch(url, options);
};

exports.delete = function(url, options = defaultOptions) {
  options = checkDefaults(options, "DELETE", defaultOptions, defaultHeaders);

  return timeoutFetch(url, options);
};

exports.createUrl = createUrl;

function timeoutFetch(url, options) {
  url = createUrl(url, options);
  return timeoutPromise(options.timeout, fetch(url, options.init)).then(
    function(response) {
      if (!response.ok) {
        throw response;
      } else {
        return response;
      }
    }
  );
}

function checkCaches(url, options, callback) {
  if (!options.matchAll) {
    return caches
      .match(url)
      .then(handleResponse)
      .then(function(response) {
        return handleCacheResponse(response, options, callback);
      });
  } else {
    return caches
      .match(url) //.matchAll(url)
      .then(handleResponse)
      .then(function(response) {
        return handleCacheResponse(response, options, callback);
      });
  }
}

function verifyOptions(options) {
  if (options.dataType && !checkValidType(options.dataType))
    throw new Error("Attempting to set invalid data type");
  if (options.timeout && isNaN(options.timeout))
    throw new Error("Timeout must be a number (in ms)");
  if (options.init && !(options.init instanceof Object))
    throw new Error("Init propery must be a json object");
  if (
    options.init &&
    options.init.credentials &&
    !checkIfValidCredentials(options.init.credentials)
  )
    throw new Error("Attempting to set invalid credential policy");
  if (options.validator && !(options.validator instanceof Function))
    throw new Error("Validator must be a function");
}
