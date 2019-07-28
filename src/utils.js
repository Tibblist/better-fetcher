exports.prepareData = function(
  data,
  options,
  type,
  defaultOptions,
  defaultHeaders
) {
  options = exports.checkDefaults(
    options,
    type,
    defaultOptions,
    defaultHeaders
  );
  if (isObject(data)) {
    data = JSON.stringify(data);
  }
  options.init.body = data;
  return options;
};

exports.mergeObjects = function(obj1, obj2) {
  var combinedObj = {};
  Object.keys(obj1).forEach(key => (combinedObj[key] = obj1[key]));
  Object.keys(obj2).forEach(key => (combinedObj[key] = obj2[key]));
  return combinedObj;
};

exports.checkDefaults = function(
  options,
  type,
  defaultOptions,
  defaultHeaders
) {
  var newOptions = {};
  Object.keys(defaultOptions).forEach(
    key => (newOptions[key] = defaultOptions[key])
  );
  Object.keys(options).forEach(key => (newOptions[key] = options[key]));
  if (!newOptions.init) newOptions.init = { method: type };
  else newOptions.init.method = type;
  if (!newOptions.init.headers) newOptions.init.headers = {};
  newOptions = changeHeaders(newOptions, type, defaultHeaders);
  return newOptions;
};
function changeHeaders(options, type, defaultHeaders) {
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

exports.createUrl = function(url, options) {
  if (options.params) {
    if (url[url.length - 1] !== "/") {
      url = url + "/";
    }
    url = url + createQueryString(options.params);
  }
  return url;
};

function createQueryString(params) {
  var queryString = "?";
  var keys = Object.keys(params);
  for (var i = 0; i < keys.length; i++) {
    if (i === keys.length - 1)
      queryString += keys[i] + "=" + params[keys[i]] + "&";
    else queryString = queryString + keys[i] + "=" + params[keys[i]] + "&";
  }
  queryString = queryString.substring(0, queryString.length - 1);
  return queryString;
}

exports.checkValidType = function(type) {
  if (
    type !== "arrayBuffer" &&
    type !== "blob" &&
    type !== "formData" &&
    type !== "json" &&
    type !== "text" &&
    type !== "auto"
  )
    return false;
  else return true;
};

exports.checkIfValidCredentials = function(mode) {
  return mode === "omit" || mode === "same-origin" || mode === "include";
};

exports.timeoutPromise = function(ms, promise) {
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
};

exports.resolveDataType = function(response) {
  var type = response.headers.get("content-type");
  if (!type || !(type instanceof String)) {
    return "none";
  }
  if (type.includes("application/json")) return "json";
  if (type.includes("text/html")) return "text";
  if (type.includes("text/plain")) return "text";
  if (type.includes("text/javascript")) return "text";
  if (type.includes("multipart/form-data")) return "formData";
  if (
    type.includes("image") ||
    type.includes("audio") ||
    type.includes("video")
  ) {
    return "blob";
  }
};

function isObject(obj) {
  return obj === Object(obj);
}
