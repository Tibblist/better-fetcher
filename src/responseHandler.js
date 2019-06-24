const { resolveDataType } = require("./utils");
var networkMap = new Map();
var cacheMap = new Map();

exports.handleResponse = function(response, validator) {
  if (!response) {
    return new Promise(function(resolve, reject) {
      reject("No response");
    });
  }
  if (validator && !validator(response)) {
    throw response;
  } else if (!validator && !response.ok) {
    throw response;
  } else {
    return response;
  }
};

exports.handleNetworkResponse = function(response, options, callback) {
  if (!options.useCache) {
    return parseResponseData(response, options);
  }
  if (options.dataType.toLowerCase() === "none") {
    setNetworkMap(options.url);
    if (options.handleNetworkResponse instanceof Function)
      options.handleNetworkResponse(response);
    else callback(response);
    return;
  }
  return handleNetworkResponseData(response, options, callback).then(function(
    data
  ) {
    setNetworkMap(options.url);
    Promise.resolve(data);
  });
};

exports.handleCacheResponse = function(response, options, callback) {
  //Don't overwrite network data with cached data
  if (networkMap.get(options.url)) {
    networkMap.delete(options.url);
    return;
  }
  if (options.dataType.toLowerCase() === "none") {
    cacheMap.set(options.url, true);
    if (options.handleCachedResponse instanceof Function)
      options.handleCachedResponse(response);
    else callback(response); ///Implement object comparison?
  } else {
    return handleCacheResponseData(response, options, callback).then(function(
      data
    ) {
      cacheMap.set(options.url, true);
      return Promise.resolve(data);
    });
  }
};

function handleNetworkResponseData(response, options, callback) {
  parseResponseData(response, options).then(function(data) {
    networkMap.set(options.url, true);
    if (options.handleNetworkResponse instanceof Function)
      options.handleNetworkResponse(data);
    else callback(data); ///Implement object comparison?
  });
}

function handleCacheResponseData(response, options, callback) {
  return parseResponseData(response, options).then(function(data) {
    if (options.handleCachedResponse instanceof Function)
      options.handleCachedResponse(data);
    else callback(data); ///Implement object comparison?
  });
}

function parseResponseData(response, options) {
  switch (options.dataType.toLowerCase()) {
    case "json":
      return response.json();
    case "blob":
      return response.blob();
    case "arraybuffer":
      return response.arrayBuffer();
    case "formdata":
      return response.formData();
    case "text":
      return response.text();
    case "auto":
      options.dataType = resolveDataType(response);
      return parseResponseData(response, options);
    default:
      return Promise.resolve(response);
  }
}

function setNetworkMap(url) {
  if (!cacheMap.get(url)) networkMap.set(url, true);
  else cacheMap.delete(url);
}
