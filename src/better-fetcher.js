var exports = (module.exports = {});
var cacheName = "";
var defaultHeaders = {
  GET: {},
  POST: {},
  PUT: {},
  DELETE: {},
  ALL: {}
};
var networkDataReceived = false;
var defaultOptions = {
  timeout: 5000,
  init: { credentials: "same-origin" }
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
  if (options.dataType && !checkValidType(options.dataType))
    throw new Error("Attempting to set invalid data type");
  if (
    options.init &&
    options.init.credentials &&
    !checkIfValidCredentials(options.init.credentials)
  )
    throw new Error("Attempting to set invalid credential policy");
  defaultOptions = options;
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
  networkDataReceived = false;

  options = checkDefaults(options, "GET");
  if (options.dataType && !checkValidType(options.dataType))
    return Promise.reject(new Error("Invalid data type"));
  url = createUrl(url, options);

  // fetch fresh data
  var networkCall = timeoutPromise(options.timeout, fetch(url, options.init))
    .then(handleResponse)
    .then(function(response) {
      networkDataReceived = true;
      return handleNetworkResponse(response, options, callback);
    });

  // fetch cached data
  if (options.useCache)
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
  options = prepareData(data, options, "POST");
  url = createUrl(url, options);

  return timeoutFetch(url, options);
};

/*
options:
init - init to pass through to fetch
*/
exports.put = function(url, data, options = defaultOptions) {
  options = prepareData(data, options, "PUT");
  url = createUrl(url, options);

  return timeoutFetch(url, options);
};

exports.delete = function(url, options = defaultOptions) {
  options = checkDefaults(options, "DELETE");
  url = createUrl(url, options);

  return timeoutFetch(url, options);
};

function timeoutFetch(url, options) {
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

function prepareData(data, options, type) {
  options = checkDefaults(options, type);
  if (isObject(data)) {
    data = JSON.stringify(data);
  }
  options.init.body = data;
  return options;
}

function checkDefaults(options, type) {
  var newOptions = {};

  Object.keys(defaultOptions).forEach(
    key => (newOptions[key] = defaultOptions[key])
  );
  Object.keys(options).forEach(key => (newOptions[key] = options[key]));

  if (!newOptions.init) newOptions.init = { method: type };
  else newOptions.init.method = type;
  if (!newOptions.init.headers) newOptions.init.headers = {};
  newOptions = changeHeaders(newOptions, type);

  return newOptions;
}

function changeHeaders(options, type) {
  var header = {};
  if (
    !options.init.headers["Content-type"] &&
    (type === "POST" || type === "PUT")
  ) {
    header = {
      "Content-type": "application/json"
    };
  }
  Object.keys(defaultHeaders.ALL).forEach(
    key => (header[key] = defaultHeaders.ALL[key])
  );
  Object.keys(defaultHeaders[type]).forEach(
    key => (header[key] = defaultHeaders[type][key])
  );
  if (options.init.headers)
    Object.keys(options.init.headers).forEach(
      key => (header[key] = options.init.headers[key])
    );

  if (Object.keys(header).length > 0) {
    options.init.headers = header;
  }

  return options;
}

function handleResponse(response) {
  if (!response) {
    return new Promise(function(resolve, reject) {
      reject("No response");
    });
  } else if (!response.ok) {
    throw response;
  } else {
    return response;
  }
}

function handleNetworkResponse(response, options, callback) {
  if (!options.useCache) {
    return parseResponseData(response, options);
  } else {
    if (!options.dataType) {
      if (options.handleNetworkResponse instanceof Function)
        options.handleNetworkResponse(response);
      else callback(response);
    } else {
      return handleNetworkResponseData(response, options, callback);
    }
  }
}

function handleNetworkResponseData(response, options, callback) {
  parseResponseData(response, options).then(function(data) {
    networkDataReceived = true;
    if (options.handleNetworkResponse instanceof Function)
      options.handleNetworkResponse(data);
    else callback(data); ///Implement object comparison?
  });
}

function handleCacheResponse(response, options, callback) {
  //Don't overwrite network data with cached data
  if (networkDataReceived) {
    return;
  }
  if (!options.dataType) {
    if (options.handleCachedResponse instanceof Function)
      options.handleCachedResponse(response);
    else callback(response); ///Implement object comparison?
  } else {
    return handleCacheResponseData(response, options, callback);
  }
}

function handleCacheResponseData(response, options, callback) {
  return parseResponseData(response, options).then(function(data) {
    if (options.handleCachedResponse instanceof Function)
      options.handleCachedResponse(data);
    else callback(data); ///Implement object comparison?
  });
}

function parseResponseData(response, options) {
  switch (options.dataType) {
    case "json":
      return response.json();
    case "blob":
      return response.blob();
    case "arrayBuffer":
      return response.arrayBuffer();
    case "formData":
      return response.formData();
    case "text":
      return response.text();
    default:
      return response;
  }
}

function createUrl(url, options) {
  if (options.params) {
    if (url[url.length - 1] !== "/") {
      url = url + "/";
    }
    url = url + createQueryString(options.params);
  }
  return url;
}

function createQueryString(params) {
  var queryString = "?";
  var keys = Object.keys(params);
  for (var i = 0; i < keys.length; i++) {
    if (i !== keys.length - 1) queryString += params[keys[i]] + "&";
    else queryString += queryString += params[keys[i]];
  }
  return queryString;
}

function checkValidType(type) {
  if (
    type !== "arrayBuffer" &&
    type !== "blob" &&
    type !== "formData" &&
    type !== "json" &&
    type !== "text"
  )
    return false;
  else return true;
}

function checkIfValidCredentials(mode) {
  return mode === "omit" || mode === "same-origin" || mode === "include";
}

function timeoutPromise(ms, promise) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Request Timeout"));
    }, ms);
    promise.then(
      res => {
        clearTimeout(timeoutId);
        resolve(res);
      },
      err => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
}

function isObject(obj) {
  return obj === Object(obj);
}
