(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
  var init_dist = __esm({
    "node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode2) {
        ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode2["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode || (ExceptionCode = {}));
      CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p2 = fn(...args);
                  remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                  return p2;
                } else {
                  throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p.remove = async () => remove();
              }
              return p;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
              const callbackId = await call;
              removeListener({
                eventName,
                callbackId
              }, callback);
            };
            const p = new Promise((resolve2) => call.then(() => resolve2({ remove })));
            p.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p;
          };
          const proxy = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                // https://github.com/facebook/react/issues/20030
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin = Capacitor.registerPlugin;
      WebPlugin = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners2 = this.listeners[eventName];
          if (!listeners2) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p = Promise.resolve({ remove });
          return p;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners2 = this.listeners[eventName];
          if (!listeners2) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners2.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg = "not implemented") {
          return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
        }
        unavailable(msg = "not available") {
          return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners2 = this.listeners[eventName];
          if (!listeners2) {
            return;
          }
          const index = listeners2.indexOf(listenerFunc);
          this.listeners[eventName].splice(index, 1);
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      readBlobAsBase64 = async (blob) => new Promise((resolve2, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve2(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key, index) => {
          acc[key] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
              form.append(key, value);
            });
          } else {
            for (const key of Object.keys(options.data)) {
              form.append(key, options.data[key]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      CapacitorHttpPluginWeb = class extends WebPlugin {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase64(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
      (function(SystemBarsStyle2) {
        SystemBarsStyle2["Dark"] = "DARK";
        SystemBarsStyle2["Light"] = "LIGHT";
        SystemBarsStyle2["Default"] = "DEFAULT";
      })(SystemBarsStyle || (SystemBarsStyle = {}));
      (function(SystemBarType2) {
        SystemBarType2["StatusBar"] = "StatusBar";
        SystemBarType2["NavigationBar"] = "NavigationBar";
      })(SystemBarType || (SystemBarType = {}));
      SystemBarsPluginWeb = class extends WebPlugin {
        async setStyle() {
          this.unavailable("not available for web");
        }
        async setAnimation() {
          this.unavailable("not available for web");
        }
        async show() {
          this.unavailable("not available for web");
        }
        async hide() {
          this.unavailable("not available for web");
        }
      };
      SystemBars = registerPlugin("SystemBars", {
        web: () => new SystemBarsPluginWeb()
      });
    }
  });

  // node_modules/@capacitor/filesystem/dist/esm/definitions.js
  var Directory, Encoding;
  var init_definitions = __esm({
    "node_modules/@capacitor/filesystem/dist/esm/definitions.js"() {
      (function(Directory2) {
        Directory2["Documents"] = "DOCUMENTS";
        Directory2["Data"] = "DATA";
        Directory2["Library"] = "LIBRARY";
        Directory2["Cache"] = "CACHE";
        Directory2["External"] = "EXTERNAL";
        Directory2["ExternalStorage"] = "EXTERNAL_STORAGE";
        Directory2["ExternalCache"] = "EXTERNAL_CACHE";
        Directory2["LibraryNoCloud"] = "LIBRARY_NO_CLOUD";
        Directory2["Temporary"] = "TEMPORARY";
      })(Directory || (Directory = {}));
      (function(Encoding2) {
        Encoding2["UTF8"] = "utf8";
        Encoding2["ASCII"] = "ascii";
        Encoding2["UTF16"] = "utf16";
      })(Encoding || (Encoding = {}));
    }
  });

  // node_modules/@capacitor/filesystem/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    FilesystemWeb: () => FilesystemWeb
  });
  function resolve(path) {
    const posix = path.split("/").filter((item) => item !== ".");
    const newPosix = [];
    posix.forEach((item) => {
      if (item === ".." && newPosix.length > 0 && newPosix[newPosix.length - 1] !== "..") {
        newPosix.pop();
      } else {
        newPosix.push(item);
      }
    });
    return newPosix.join("/");
  }
  function isPathParent(parent, children) {
    parent = resolve(parent);
    children = resolve(children);
    const pathsA = parent.split("/");
    const pathsB = children.split("/");
    return parent !== children && pathsA.every((value, index) => value === pathsB[index]);
  }
  var FilesystemWeb;
  var init_web = __esm({
    "node_modules/@capacitor/filesystem/dist/esm/web.js"() {
      init_dist();
      init_definitions();
      FilesystemWeb = class _FilesystemWeb extends WebPlugin {
        constructor() {
          super(...arguments);
          this.DB_VERSION = 1;
          this.DB_NAME = "Disc";
          this._writeCmds = ["add", "put", "delete"];
          this.downloadFile = async (options) => {
            var _a, _b;
            const requestInit = buildRequestInit(options, options.webFetchExtra);
            const response = await fetch(options.url, requestInit);
            let blob;
            if (!options.progress)
              blob = await response.blob();
            else if (!(response === null || response === void 0 ? void 0 : response.body))
              blob = new Blob();
            else {
              const reader = response.body.getReader();
              let bytes = 0;
              const chunks = [];
              const contentType = response.headers.get("content-type");
              const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
              while (true) {
                const { done, value } = await reader.read();
                if (done)
                  break;
                chunks.push(value);
                bytes += (value === null || value === void 0 ? void 0 : value.length) || 0;
                const status = {
                  url: options.url,
                  bytes,
                  contentLength
                };
                this.notifyListeners("progress", status);
              }
              const allChunks = new Uint8Array(bytes);
              let position = 0;
              for (const chunk of chunks) {
                if (typeof chunk === "undefined")
                  continue;
                allChunks.set(chunk, position);
                position += chunk.length;
              }
              blob = new Blob([allChunks.buffer], { type: contentType || void 0 });
            }
            const result = await this.writeFile({
              path: options.path,
              directory: (_a = options.directory) !== null && _a !== void 0 ? _a : void 0,
              recursive: (_b = options.recursive) !== null && _b !== void 0 ? _b : false,
              data: blob
            });
            return { path: result.uri, blob };
          };
        }
        readFileInChunks(_options, _callback) {
          throw this.unavailable("Method not implemented.");
        }
        async initDb() {
          if (this._db !== void 0) {
            return this._db;
          }
          if (!("indexedDB" in window)) {
            throw this.unavailable("This browser doesn't support IndexedDB");
          }
          return new Promise((resolve2, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            request.onupgradeneeded = _FilesystemWeb.doUpgrade;
            request.onsuccess = () => {
              this._db = request.result;
              resolve2(request.result);
            };
            request.onerror = () => reject(request.error);
            request.onblocked = () => {
              console.warn("db blocked");
            };
          });
        }
        static doUpgrade(event) {
          const eventTarget = event.target;
          const db = eventTarget.result;
          switch (event.oldVersion) {
            case 0:
            case 1:
            default: {
              if (db.objectStoreNames.contains("FileStorage")) {
                db.deleteObjectStore("FileStorage");
              }
              const store = db.createObjectStore("FileStorage", { keyPath: "path" });
              store.createIndex("by_folder", "folder");
            }
          }
        }
        async dbRequest(cmd, args) {
          const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
          return this.initDb().then((conn) => {
            return new Promise((resolve2, reject) => {
              const tx = conn.transaction(["FileStorage"], readFlag);
              const store = tx.objectStore("FileStorage");
              const req = store[cmd](...args);
              req.onsuccess = () => resolve2(req.result);
              req.onerror = () => reject(req.error);
            });
          });
        }
        async dbIndexRequest(indexName, cmd, args) {
          const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
          return this.initDb().then((conn) => {
            return new Promise((resolve2, reject) => {
              const tx = conn.transaction(["FileStorage"], readFlag);
              const store = tx.objectStore("FileStorage");
              const index = store.index(indexName);
              const req = index[cmd](...args);
              req.onsuccess = () => resolve2(req.result);
              req.onerror = () => reject(req.error);
            });
          });
        }
        getPath(directory, uriPath) {
          const cleanedUriPath = uriPath !== void 0 ? uriPath.replace(/^[/]+|[/]+$/g, "") : "";
          let fsPath = "";
          if (directory !== void 0)
            fsPath += "/" + directory;
          if (uriPath !== "")
            fsPath += "/" + cleanedUriPath;
          return fsPath;
        }
        async clear() {
          const conn = await this.initDb();
          const tx = conn.transaction(["FileStorage"], "readwrite");
          const store = tx.objectStore("FileStorage");
          store.clear();
        }
        /**
         * Read a file from disk
         * @param options options for the file read
         * @return a promise that resolves with the read file data result
         */
        async readFile(options) {
          const path = this.getPath(options.directory, options.path);
          const entry = await this.dbRequest("get", [path]);
          if (entry === void 0)
            throw Error("File does not exist.");
          return { data: entry.content ? entry.content : "" };
        }
        /**
         * Write a file to disk in the specified location on device
         * @param options options for the file write
         * @return a promise that resolves with the file write result
         */
        async writeFile(options) {
          const path = this.getPath(options.directory, options.path);
          let data = options.data;
          const encoding = options.encoding;
          const doRecursive = options.recursive;
          const occupiedEntry = await this.dbRequest("get", [path]);
          if (occupiedEntry && occupiedEntry.type === "directory")
            throw Error("The supplied path is a directory.");
          const parentPath = path.substr(0, path.lastIndexOf("/"));
          const parentEntry = await this.dbRequest("get", [parentPath]);
          if (parentEntry === void 0) {
            const subDirIndex = parentPath.indexOf("/", 1);
            if (subDirIndex !== -1) {
              const parentArgPath = parentPath.substr(subDirIndex);
              await this.mkdir({
                path: parentArgPath,
                directory: options.directory,
                recursive: doRecursive
              });
            }
          }
          if (!encoding && !(data instanceof Blob)) {
            data = data.indexOf(",") >= 0 ? data.split(",")[1] : data;
            if (!this.isBase64String(data))
              throw Error("The supplied data is not valid base64 content.");
          }
          const now = Date.now();
          const pathObj = {
            path,
            folder: parentPath,
            type: "file",
            size: data instanceof Blob ? data.size : data.length,
            ctime: now,
            mtime: now,
            content: data
          };
          await this.dbRequest("put", [pathObj]);
          return {
            uri: pathObj.path
          };
        }
        /**
         * Append to a file on disk in the specified location on device
         * @param options options for the file append
         * @return a promise that resolves with the file write result
         */
        async appendFile(options) {
          const path = this.getPath(options.directory, options.path);
          let data = options.data;
          const encoding = options.encoding;
          const parentPath = path.substr(0, path.lastIndexOf("/"));
          const now = Date.now();
          let ctime = now;
          const occupiedEntry = await this.dbRequest("get", [path]);
          if (occupiedEntry && occupiedEntry.type === "directory")
            throw Error("The supplied path is a directory.");
          const parentEntry = await this.dbRequest("get", [parentPath]);
          if (parentEntry === void 0) {
            const subDirIndex = parentPath.indexOf("/", 1);
            if (subDirIndex !== -1) {
              const parentArgPath = parentPath.substr(subDirIndex);
              await this.mkdir({
                path: parentArgPath,
                directory: options.directory,
                recursive: true
              });
            }
          }
          if (!encoding && !this.isBase64String(data))
            throw Error("The supplied data is not valid base64 content.");
          if (occupiedEntry !== void 0) {
            if (occupiedEntry.content instanceof Blob) {
              throw Error("The occupied entry contains a Blob object which cannot be appended to.");
            }
            if (occupiedEntry.content !== void 0 && !encoding) {
              data = btoa(atob(occupiedEntry.content) + atob(data));
            } else {
              data = occupiedEntry.content + data;
            }
            ctime = occupiedEntry.ctime;
          }
          const pathObj = {
            path,
            folder: parentPath,
            type: "file",
            size: data.length,
            ctime,
            mtime: now,
            content: data
          };
          await this.dbRequest("put", [pathObj]);
        }
        /**
         * Delete a file from disk
         * @param options options for the file delete
         * @return a promise that resolves with the deleted file data result
         */
        async deleteFile(options) {
          const path = this.getPath(options.directory, options.path);
          const entry = await this.dbRequest("get", [path]);
          if (entry === void 0)
            throw Error("File does not exist.");
          const entries = await this.dbIndexRequest("by_folder", "getAllKeys", [IDBKeyRange.only(path)]);
          if (entries.length !== 0)
            throw Error("Folder is not empty.");
          await this.dbRequest("delete", [path]);
        }
        /**
         * Create a directory.
         * @param options options for the mkdir
         * @return a promise that resolves with the mkdir result
         */
        async mkdir(options) {
          const path = this.getPath(options.directory, options.path);
          const doRecursive = options.recursive;
          const parentPath = path.substr(0, path.lastIndexOf("/"));
          const depth = (path.match(/\//g) || []).length;
          const parentEntry = await this.dbRequest("get", [parentPath]);
          const occupiedEntry = await this.dbRequest("get", [path]);
          if (depth === 1)
            throw Error("Cannot create Root directory");
          if (occupiedEntry !== void 0)
            throw Error("Current directory does already exist.");
          if (!doRecursive && depth !== 2 && parentEntry === void 0)
            throw Error("Parent directory must exist");
          if (doRecursive && depth !== 2 && parentEntry === void 0) {
            const parentArgPath = parentPath.substr(parentPath.indexOf("/", 1));
            await this.mkdir({
              path: parentArgPath,
              directory: options.directory,
              recursive: doRecursive
            });
          }
          const now = Date.now();
          const pathObj = {
            path,
            folder: parentPath,
            type: "directory",
            size: 0,
            ctime: now,
            mtime: now
          };
          await this.dbRequest("put", [pathObj]);
        }
        /**
         * Remove a directory
         * @param options the options for the directory remove
         */
        async rmdir(options) {
          const { path, directory, recursive } = options;
          const fullPath = this.getPath(directory, path);
          const entry = await this.dbRequest("get", [fullPath]);
          if (entry === void 0)
            throw Error("Folder does not exist.");
          if (entry.type !== "directory")
            throw Error("Requested path is not a directory");
          const readDirResult = await this.readdir({ path, directory });
          if (readDirResult.files.length !== 0 && !recursive)
            throw Error("Folder is not empty");
          for (const entry2 of readDirResult.files) {
            const entryPath = `${path}/${entry2.name}`;
            const entryObj = await this.stat({ path: entryPath, directory });
            if (entryObj.type === "file") {
              await this.deleteFile({ path: entryPath, directory });
            } else {
              await this.rmdir({ path: entryPath, directory, recursive });
            }
          }
          await this.dbRequest("delete", [fullPath]);
        }
        /**
         * Return a list of files from the directory (not recursive)
         * @param options the options for the readdir operation
         * @return a promise that resolves with the readdir directory listing result
         */
        async readdir(options) {
          const path = this.getPath(options.directory, options.path);
          const entry = await this.dbRequest("get", [path]);
          if (options.path !== "" && entry === void 0)
            throw Error("Folder does not exist.");
          const entries = await this.dbIndexRequest("by_folder", "getAllKeys", [IDBKeyRange.only(path)]);
          const files = await Promise.all(entries.map(async (e) => {
            let subEntry = await this.dbRequest("get", [e]);
            if (subEntry === void 0) {
              subEntry = await this.dbRequest("get", [e + "/"]);
            }
            return {
              name: e.substring(path.length + 1),
              type: subEntry.type,
              size: subEntry.size,
              ctime: subEntry.ctime,
              mtime: subEntry.mtime,
              uri: subEntry.path
            };
          }));
          return { files };
        }
        /**
         * Return full File URI for a path and directory
         * @param options the options for the stat operation
         * @return a promise that resolves with the file stat result
         */
        async getUri(options) {
          const path = this.getPath(options.directory, options.path);
          let entry = await this.dbRequest("get", [path]);
          if (entry === void 0) {
            entry = await this.dbRequest("get", [path + "/"]);
          }
          return {
            uri: (entry === null || entry === void 0 ? void 0 : entry.path) || path
          };
        }
        /**
         * Return data about a file
         * @param options the options for the stat operation
         * @return a promise that resolves with the file stat result
         */
        async stat(options) {
          const path = this.getPath(options.directory, options.path);
          let entry = await this.dbRequest("get", [path]);
          if (entry === void 0) {
            entry = await this.dbRequest("get", [path + "/"]);
          }
          if (entry === void 0)
            throw Error("Entry does not exist.");
          return {
            name: entry.path.substring(path.length + 1),
            type: entry.type,
            size: entry.size,
            ctime: entry.ctime,
            mtime: entry.mtime,
            uri: entry.path
          };
        }
        /**
         * Rename a file or directory
         * @param options the options for the rename operation
         * @return a promise that resolves with the rename result
         */
        async rename(options) {
          await this._copy(options, true);
          return;
        }
        /**
         * Copy a file or directory
         * @param options the options for the copy operation
         * @return a promise that resolves with the copy result
         */
        async copy(options) {
          return this._copy(options, false);
        }
        async requestPermissions() {
          return { publicStorage: "granted" };
        }
        async checkPermissions() {
          return { publicStorage: "granted" };
        }
        /**
         * Function that can perform a copy or a rename
         * @param options the options for the rename operation
         * @param doRename whether to perform a rename or copy operation
         * @return a promise that resolves with the result
         */
        async _copy(options, doRename = false) {
          let { toDirectory } = options;
          const { to, from, directory: fromDirectory } = options;
          if (!to || !from) {
            throw Error("Both to and from must be provided");
          }
          if (!toDirectory) {
            toDirectory = fromDirectory;
          }
          const fromPath = this.getPath(fromDirectory, from);
          const toPath = this.getPath(toDirectory, to);
          if (fromPath === toPath) {
            return {
              uri: toPath
            };
          }
          if (isPathParent(fromPath, toPath)) {
            throw Error("To path cannot contain the from path");
          }
          let toObj;
          try {
            toObj = await this.stat({
              path: to,
              directory: toDirectory
            });
          } catch (e) {
            const toPathComponents = to.split("/");
            toPathComponents.pop();
            const toPath2 = toPathComponents.join("/");
            if (toPathComponents.length > 0) {
              const toParentDirectory = await this.stat({
                path: toPath2,
                directory: toDirectory
              });
              if (toParentDirectory.type !== "directory") {
                throw new Error("Parent directory of the to path is a file");
              }
            }
          }
          if (toObj && toObj.type === "directory") {
            throw new Error("Cannot overwrite a directory with a file");
          }
          const fromObj = await this.stat({
            path: from,
            directory: fromDirectory
          });
          const updateTime = async (path, ctime2, mtime) => {
            const fullPath = this.getPath(toDirectory, path);
            const entry = await this.dbRequest("get", [fullPath]);
            entry.ctime = ctime2;
            entry.mtime = mtime;
            await this.dbRequest("put", [entry]);
          };
          const ctime = fromObj.ctime ? fromObj.ctime : Date.now();
          switch (fromObj.type) {
            // The "from" object is a file
            case "file": {
              const file = await this.readFile({
                path: from,
                directory: fromDirectory
              });
              if (doRename) {
                await this.deleteFile({
                  path: from,
                  directory: fromDirectory
                });
              }
              let encoding;
              if (!(file.data instanceof Blob) && !this.isBase64String(file.data)) {
                encoding = Encoding.UTF8;
              }
              const writeResult = await this.writeFile({
                path: to,
                directory: toDirectory,
                data: file.data,
                encoding
              });
              if (doRename) {
                await updateTime(to, ctime, fromObj.mtime);
              }
              return writeResult;
            }
            case "directory": {
              if (toObj) {
                throw Error("Cannot move a directory over an existing object");
              }
              try {
                await this.mkdir({
                  path: to,
                  directory: toDirectory,
                  recursive: false
                });
                if (doRename) {
                  await updateTime(to, ctime, fromObj.mtime);
                }
              } catch (e) {
              }
              const contents = (await this.readdir({
                path: from,
                directory: fromDirectory
              })).files;
              for (const filename of contents) {
                await this._copy({
                  from: `${from}/${filename.name}`,
                  to: `${to}/${filename.name}`,
                  directory: fromDirectory,
                  toDirectory
                }, doRename);
              }
              if (doRename) {
                await this.rmdir({
                  path: from,
                  directory: fromDirectory
                });
              }
            }
          }
          return {
            uri: toPath
          };
        }
        isBase64String(str) {
          try {
            return btoa(atob(str)) == str;
          } catch (err) {
            return false;
          }
        }
      };
      FilesystemWeb._debug = true;
    }
  });

  // node_modules/@capacitor/geolocation/dist/esm/web.js
  var web_exports2 = {};
  __export(web_exports2, {
    Geolocation: () => Geolocation,
    GeolocationWeb: () => GeolocationWeb
  });
  var GeolocationWeb, Geolocation;
  var init_web2 = __esm({
    "node_modules/@capacitor/geolocation/dist/esm/web.js"() {
      init_dist();
      GeolocationWeb = class extends WebPlugin {
        constructor() {
          super();
          this.latestOrientation = null;
          if (typeof window !== "undefined") {
            const win = window;
            if ("ondeviceorientationabsolute" in win) {
              win.addEventListener("deviceorientationabsolute", (event) => this.updateOrientation(event, true), true);
            } else if ("ondeviceorientation" in win) {
              win.addEventListener("deviceorientation", (event) => this.updateOrientation(event, false), true);
            }
          }
        }
        updateOrientation(event, isAbsolute) {
          let trueHeading = null;
          let magneticHeading = null;
          let headingAccuracy = null;
          if (isAbsolute && event.alpha !== null) {
            trueHeading = (360 - event.alpha) % 360;
          } else if (event.webkitCompassHeading !== void 0 && event.webkitCompassHeading !== null) {
            magneticHeading = event.webkitCompassHeading;
            headingAccuracy = event.webkitCompassAccuracy;
          } else if (event.alpha !== null && event.absolute === true) {
            trueHeading = (360 - event.alpha) % 360;
          } else if (event.alpha !== null) {
            magneticHeading = (360 - event.alpha) % 360;
          }
          if (trueHeading !== null || magneticHeading !== null) {
            this.latestOrientation = {
              trueHeading,
              magneticHeading,
              headingAccuracy
            };
          }
        }
        augmentPosition(pos, isWatch = false) {
          var _a, _b, _c, _d, _e, _f, _g;
          const coords = pos.coords;
          const orientation = isWatch ? this.latestOrientation : null;
          const heading = (_c = (_b = (_a = orientation === null || orientation === void 0 ? void 0 : orientation.trueHeading) !== null && _a !== void 0 ? _a : orientation === null || orientation === void 0 ? void 0 : orientation.magneticHeading) !== null && _b !== void 0 ? _b : isWatch ? coords.heading : null) !== null && _c !== void 0 ? _c : null;
          return {
            timestamp: pos.timestamp,
            coords: {
              latitude: coords.latitude,
              longitude: coords.longitude,
              accuracy: coords.accuracy,
              altitude: coords.altitude,
              altitudeAccuracy: coords.altitudeAccuracy,
              speed: coords.speed,
              heading,
              magneticHeading: (_d = orientation === null || orientation === void 0 ? void 0 : orientation.magneticHeading) !== null && _d !== void 0 ? _d : null,
              trueHeading: (_e = orientation === null || orientation === void 0 ? void 0 : orientation.trueHeading) !== null && _e !== void 0 ? _e : null,
              headingAccuracy: (_f = orientation === null || orientation === void 0 ? void 0 : orientation.headingAccuracy) !== null && _f !== void 0 ? _f : null,
              course: (_g = isWatch ? coords.heading : null) !== null && _g !== void 0 ? _g : null
            }
          };
        }
        async getCurrentPosition(options) {
          return new Promise((resolve2, reject) => {
            navigator.geolocation.getCurrentPosition((pos) => {
              resolve2(this.augmentPosition(pos, false));
            }, (err) => {
              reject(err);
            }, Object.assign({ enableHighAccuracy: false, timeout: 1e4, maximumAge: 0 }, options));
          });
        }
        async watchPosition(options, callback) {
          const id = navigator.geolocation.watchPosition((pos) => {
            callback(this.augmentPosition(pos, true));
          }, (err) => {
            callback(null, err);
          }, Object.assign({ enableHighAccuracy: false, timeout: 1e4, maximumAge: 0, minimumUpdateInterval: 5e3 }, options));
          return `${id}`;
        }
        async clearWatch(options) {
          navigator.geolocation.clearWatch(parseInt(options.id, 10));
        }
        async checkPermissions() {
          if (typeof navigator === "undefined" || !navigator.permissions) {
            throw this.unavailable("Permissions API not available in this browser");
          }
          const permission = await navigator.permissions.query({
            name: "geolocation"
          });
          return { location: permission.state, coarseLocation: permission.state };
        }
        async requestPermissions() {
          throw this.unimplemented("Not implemented on web.");
        }
      };
      Geolocation = new GeolocationWeb();
    }
  });

  // node_modules/@capacitor-community/speech-recognition/dist/esm/web.js
  var web_exports3 = {};
  __export(web_exports3, {
    SpeechRecognition: () => SpeechRecognition,
    SpeechRecognitionWeb: () => SpeechRecognitionWeb
  });
  var SpeechRecognitionWeb, SpeechRecognition;
  var init_web3 = __esm({
    "node_modules/@capacitor-community/speech-recognition/dist/esm/web.js"() {
      init_dist();
      SpeechRecognitionWeb = class extends WebPlugin {
        available() {
          throw this.unimplemented("Method not implemented on web.");
        }
        start(_options) {
          throw this.unimplemented("Method not implemented on web.");
        }
        stop() {
          throw this.unimplemented("Method not implemented on web.");
        }
        getSupportedLanguages() {
          throw this.unimplemented("Method not implemented on web.");
        }
        hasPermission() {
          throw this.unimplemented("Method not implemented on web.");
        }
        isListening() {
          throw this.unimplemented("Method not implemented on web.");
        }
        requestPermission() {
          throw this.unimplemented("Method not implemented on web.");
        }
        checkPermissions() {
          throw this.unimplemented("Method not implemented on web.");
        }
        requestPermissions() {
          throw this.unimplemented("Method not implemented on web.");
        }
      };
      SpeechRecognition = new SpeechRecognitionWeb();
    }
  });

  // node_modules/@capacitor-community/text-to-speech/dist/esm/web.js
  var web_exports4 = {};
  __export(web_exports4, {
    TextToSpeechWeb: () => TextToSpeechWeb
  });
  var TextToSpeechWeb;
  var init_web4 = __esm({
    "node_modules/@capacitor-community/text-to-speech/dist/esm/web.js"() {
      init_dist();
      TextToSpeechWeb = class extends WebPlugin {
        constructor() {
          super();
          this.speechSynthesis = null;
          if ("speechSynthesis" in window) {
            this.speechSynthesis = window.speechSynthesis;
            window.addEventListener("beforeunload", () => {
              this.stop();
            });
          }
        }
        async speak(options) {
          if (!this.speechSynthesis) {
            this.throwUnsupportedError();
          }
          await this.stop();
          const speechSynthesis = this.speechSynthesis;
          const utterance = this.createSpeechSynthesisUtterance(options);
          return new Promise((resolve2, reject) => {
            utterance.onend = () => {
              resolve2();
            };
            utterance.onerror = (event) => {
              reject(event);
            };
            speechSynthesis.speak(utterance);
          });
        }
        async stop() {
          if (!this.speechSynthesis) {
            this.throwUnsupportedError();
          }
          this.speechSynthesis.cancel();
        }
        async getSupportedLanguages() {
          const voices = this.getSpeechSynthesisVoices();
          const languages = voices.map((voice) => voice.lang);
          const filteredLanguages = languages.filter((v, i, a) => a.indexOf(v) == i);
          return { languages: filteredLanguages };
        }
        async getSupportedVoices() {
          const voices = this.getSpeechSynthesisVoices();
          return { voices };
        }
        async isLanguageSupported(options) {
          const result = await this.getSupportedLanguages();
          const isLanguageSupported = result.languages.includes(options.lang);
          return { supported: isLanguageSupported };
        }
        async openInstall() {
          this.throwUnimplementedError();
        }
        createSpeechSynthesisUtterance(options) {
          const voices = this.getSpeechSynthesisVoices();
          const utterance = new SpeechSynthesisUtterance();
          const { text, lang, rate, pitch, volume, voice } = options;
          if (voice !== void 0) {
            utterance.voice = voices[voice];
          }
          if (volume !== void 0) {
            utterance.volume = volume >= 0 && volume <= 1 ? volume : 1;
          }
          if (rate !== void 0) {
            utterance.rate = rate >= 0.1 && rate <= 10 ? rate : 1;
          }
          if (pitch !== void 0) {
            utterance.pitch = pitch >= 0 && pitch <= 2 ? pitch : 2;
          }
          if (lang) {
            utterance.lang = lang;
          }
          utterance.text = text;
          return utterance;
        }
        getSpeechSynthesisVoices() {
          if (!this.speechSynthesis) {
            this.throwUnsupportedError();
          }
          if (!this.supportedVoices || this.supportedVoices.length < 1) {
            this.supportedVoices = this.speechSynthesis.getVoices();
          }
          return this.supportedVoices;
        }
        throwUnsupportedError() {
          throw this.unavailable("SpeechSynthesis API not available in this browser.");
        }
        throwUnimplementedError() {
          throw this.unimplemented("Not implemented on web.");
        }
      };
    }
  });

  // node_modules/@capacitor-community/contacts/dist/esm/web.js
  var web_exports5 = {};
  __export(web_exports5, {
    ContactsWeb: () => ContactsWeb
  });
  var ContactsWeb;
  var init_web5 = __esm({
    "node_modules/@capacitor-community/contacts/dist/esm/web.js"() {
      init_dist();
      ContactsWeb = class extends WebPlugin {
        async checkPermissions() {
          throw this.unimplemented("Not implemented on web.");
        }
        async requestPermissions() {
          throw this.unimplemented("Not implemented on web.");
        }
        async getContact() {
          throw this.unimplemented("Not implemented on web.");
        }
        async getContacts() {
          throw this.unimplemented("Not implemented on web.");
        }
        async createContact() {
          throw this.unimplemented("Not implemented on web.");
        }
        async deleteContact() {
          throw this.unimplemented("Not implemented on web.");
        }
        async pickContact() {
          throw this.unimplemented("Not implemented on web.");
        }
      };
    }
  });

  // node_modules/@ebarooni/capacitor-calendar/dist/esm/web.js
  var web_exports6 = {};
  __export(web_exports6, {
    CapacitorCalendarWeb: () => CapacitorCalendarWeb
  });
  var CapacitorCalendarWeb;
  var init_web6 = __esm({
    "node_modules/@ebarooni/capacitor-calendar/dist/esm/web.js"() {
      init_dist();
      CapacitorCalendarWeb = class extends WebPlugin {
        checkPermission(_options) {
          return this.throwUnimplemented(this.checkPermission.name);
        }
        checkAllPermissions() {
          return this.throwUnimplemented(this.checkAllPermissions.name);
        }
        requestPermission(_options) {
          return this.throwUnimplemented(this.requestPermission.name);
        }
        createRemindersList(_options) {
          return this.throwUnimplemented(this.createRemindersList.name);
        }
        deleteRemindersList(_options) {
          return this.throwUnimplemented(this.deleteRemindersList.name);
        }
        requestAllPermissions() {
          return this.throwUnimplemented(this.requestAllPermissions.name);
        }
        requestWriteOnlyCalendarAccess() {
          return this.throwUnimplemented(this.requestWriteOnlyCalendarAccess.name);
        }
        requestReadOnlyCalendarAccess() {
          return this.throwUnimplemented(this.requestReadOnlyCalendarAccess.name);
        }
        requestFullCalendarAccess() {
          return this.throwUnimplemented(this.requestFullCalendarAccess.name);
        }
        requestFullRemindersAccess() {
          return this.throwUnimplemented(this.requestFullRemindersAccess.name);
        }
        createEventWithPrompt(_options) {
          return this.throwUnimplemented(this.createEventWithPrompt.name);
        }
        modifyEventWithPrompt(_options) {
          return this.throwUnimplemented(this.modifyEventWithPrompt.name);
        }
        createEvent(_options) {
          return this.throwUnimplemented(this.createEvent.name);
        }
        commit() {
          return this.throwUnimplemented(this.commit.name);
        }
        modifyEvent(_options) {
          return this.throwUnimplemented(this.modifyEvent.name);
        }
        selectCalendarsWithPrompt(_options) {
          return this.throwUnimplemented(this.selectCalendarsWithPrompt.name);
        }
        fetchAllCalendarSources() {
          return this.throwUnimplemented(this.fetchAllCalendarSources.name);
        }
        listCalendars() {
          return this.throwUnimplemented(this.listCalendars.name);
        }
        fetchAllRemindersSources() {
          return this.throwUnimplemented(this.fetchAllRemindersSources.name);
        }
        getDefaultCalendar() {
          return this.throwUnimplemented(this.getDefaultCalendar.name);
        }
        getDefaultRemindersList() {
          return this.throwUnimplemented(this.getDefaultRemindersList.name);
        }
        openReminders() {
          return this.throwUnimplemented(this.openReminders.name);
        }
        getRemindersLists() {
          return this.throwUnimplemented(this.getRemindersLists.name);
        }
        openCalendar(_options) {
          return this.throwUnimplemented(this.openCalendar.name);
        }
        createCalendar(_options) {
          return this.throwUnimplemented(this.createCalendar.name);
        }
        deleteCalendar(_options) {
          return this.throwUnimplemented(this.deleteCalendar.name);
        }
        createReminder(_options) {
          return this.throwUnimplemented(this.createReminder.name);
        }
        deleteRemindersById(_options) {
          return this.throwUnimplemented(this.deleteRemindersById.name);
        }
        deleteReminder(_options) {
          return this.throwUnimplemented(this.deleteReminder.name);
        }
        modifyReminder(_options) {
          return this.throwUnimplemented(this.modifyReminder.name);
        }
        getReminderById(_options) {
          return this.throwUnimplemented(this.getReminderById.name);
        }
        getRemindersFromLists(_options) {
          return this.throwUnimplemented(this.getRemindersFromLists.name);
        }
        deleteEventsById(_options) {
          return this.throwUnimplemented(this.deleteEventsById.name);
        }
        deleteEvent(_options) {
          return this.throwUnimplemented(this.deleteEvent.name);
        }
        deleteEventWithPrompt(_options) {
          return this.throwUnimplemented(this.deleteEventWithPrompt.name);
        }
        listEventsInRange(_options) {
          return this.throwUnimplemented(this.listEventsInRange.name);
        }
        modifyCalendar(_options) {
          return this.throwUnimplemented(this.modifyCalendar.name);
        }
        deleteReminderWithPrompt(_options) {
          return this.throwUnimplemented(this.deleteReminderWithPrompt.name);
        }
        updateRemindersList(_options) {
          return this.throwUnimplemented(this.updateRemindersList.name);
        }
        throwUnimplemented(methodName) {
          return Promise.reject(this.unimplemented(`${methodName} is not implemented on the web.`));
        }
      };
    }
  });

  // node_modules/@capacitor/app/dist/esm/web.js
  var web_exports7 = {};
  __export(web_exports7, {
    AppWeb: () => AppWeb
  });
  var AppWeb;
  var init_web7 = __esm({
    "node_modules/@capacitor/app/dist/esm/web.js"() {
      init_dist();
      AppWeb = class extends WebPlugin {
        constructor() {
          super();
          this.handleVisibilityChange = () => {
            const data = {
              isActive: document.hidden !== true
            };
            this.notifyListeners("appStateChange", data);
            if (document.hidden) {
              this.notifyListeners("pause", null);
            } else {
              this.notifyListeners("resume", null);
            }
          };
          document.addEventListener("visibilitychange", this.handleVisibilityChange, false);
        }
        exitApp() {
          throw this.unimplemented("Not implemented on web.");
        }
        async getInfo() {
          throw this.unimplemented("Not implemented on web.");
        }
        async getLaunchUrl() {
          return { url: "" };
        }
        async getState() {
          return { isActive: document.hidden !== true };
        }
        async minimizeApp() {
          throw this.unimplemented("Not implemented on web.");
        }
        async toggleBackButtonHandler() {
          throw this.unimplemented("Not implemented on web.");
        }
        async getAppLanguage() {
          return {
            value: navigator.language.split("-")[0].toLowerCase()
          };
        }
      };
    }
  });

  // src/native.js
  init_dist();

  // node_modules/@capacitor/camera/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor/camera/dist/esm/web.js
  init_dist();

  // node_modules/@capacitor/camera/dist/esm/definitions.js
  var CameraSource;
  (function(CameraSource2) {
    CameraSource2["Prompt"] = "PROMPT";
    CameraSource2["Camera"] = "CAMERA";
    CameraSource2["Photos"] = "PHOTOS";
  })(CameraSource || (CameraSource = {}));
  var CameraDirection;
  (function(CameraDirection2) {
    CameraDirection2["Rear"] = "REAR";
    CameraDirection2["Front"] = "FRONT";
  })(CameraDirection || (CameraDirection = {}));
  var CameraResultType;
  (function(CameraResultType2) {
    CameraResultType2["Uri"] = "uri";
    CameraResultType2["Base64"] = "base64";
    CameraResultType2["DataUrl"] = "dataUrl";
  })(CameraResultType || (CameraResultType = {}));
  var MediaType;
  (function(MediaType2) {
    MediaType2[MediaType2["Photo"] = 0] = "Photo";
    MediaType2[MediaType2["Video"] = 1] = "Video";
  })(MediaType || (MediaType = {}));
  var MediaTypeSelection;
  (function(MediaTypeSelection2) {
    MediaTypeSelection2[MediaTypeSelection2["Photo"] = 0] = "Photo";
    MediaTypeSelection2[MediaTypeSelection2["Video"] = 1] = "Video";
    MediaTypeSelection2[MediaTypeSelection2["All"] = 2] = "All";
  })(MediaTypeSelection || (MediaTypeSelection = {}));
  var EncodingType;
  (function(EncodingType2) {
    EncodingType2[EncodingType2["JPEG"] = 0] = "JPEG";
    EncodingType2[EncodingType2["PNG"] = 1] = "PNG";
  })(EncodingType || (EncodingType = {}));
  var CameraErrorCode;
  (function(CameraErrorCode2) {
    CameraErrorCode2["CameraPermissionDenied"] = "OS-PLUG-CAMR-0003";
    CameraErrorCode2["GalleryPermissionDenied"] = "OS-PLUG-CAMR-0005";
    CameraErrorCode2["NoCameraAvailable"] = "OS-PLUG-CAMR-0007";
    CameraErrorCode2["TakePhotoCancelled"] = "OS-PLUG-CAMR-0006";
    CameraErrorCode2["TakePhotoFailed"] = "OS-PLUG-CAMR-0010";
    CameraErrorCode2["TakePhotoInvalidArguments"] = "OS-PLUG-CAMR-0014";
    CameraErrorCode2["InvalidImageData"] = "OS-PLUG-CAMR-0008";
    CameraErrorCode2["EditPhotoFailed"] = "OS-PLUG-CAMR-0009";
    CameraErrorCode2["EditPhotoCancelled"] = "OS-PLUG-CAMR-0013";
    CameraErrorCode2["EditPhotoEmptyUri"] = "OS-PLUG-CAMR-0024";
    CameraErrorCode2["ImageNotFound"] = "OS-PLUG-CAMR-0011";
    CameraErrorCode2["ProcessImageFailed"] = "OS-PLUG-CAMR-0012";
    CameraErrorCode2["ChooseMediaFailed"] = "OS-PLUG-CAMR-0018";
    CameraErrorCode2["ChooseMediaCancelled"] = "OS-PLUG-CAMR-0020";
    CameraErrorCode2["MediaPathError"] = "OS-PLUG-CAMR-0021";
    CameraErrorCode2["FetchImageFromUriFailed"] = "OS-PLUG-CAMR-0028";
    CameraErrorCode2["RecordVideoFailed"] = "OS-PLUG-CAMR-0016";
    CameraErrorCode2["RecordVideoCancelled"] = "OS-PLUG-CAMR-0017";
    CameraErrorCode2["VideoNotFound"] = "OS-PLUG-CAMR-0025";
    CameraErrorCode2["PlayVideoFailed"] = "OS-PLUG-CAMR-0023";
    CameraErrorCode2["EncodeResultFailed"] = "OS-PLUG-CAMR-0019";
    CameraErrorCode2["FileNotFound"] = "OS-PLUG-CAMR-0027";
    CameraErrorCode2["InvalidArgument"] = "OS-PLUG-CAMR-0031";
    CameraErrorCode2["GeneralError"] = "OS-PLUG-CAMR-0026";
  })(CameraErrorCode || (CameraErrorCode = {}));

  // node_modules/@capacitor/camera/dist/esm/web.js
  var CameraWeb = class extends WebPlugin {
    async takePhoto(options) {
      return new Promise(async (resolve2, reject) => {
        if (options.webUseInput) {
          this.takePhotoCameraInputExperience(options, resolve2, reject);
        } else {
          this.takePhotoCameraExperience(options, resolve2, reject);
        }
      });
    }
    async recordVideo(_options) {
      throw this.unimplemented("recordVideo is not implemented on Web.");
    }
    async playVideo(_options) {
      throw this.unimplemented("playVideo is not implemented on Web.");
    }
    async chooseFromGallery(options) {
      return new Promise(async (resolve2, reject) => {
        this.galleryInputExperience(options, resolve2, reject);
      });
    }
    async editPhoto(_options) {
      throw this.unimplemented("editPhoto is not implemented on Web.");
    }
    async editURIPhoto(_options) {
      throw this.unimplemented("editURIPhoto is not implemented on Web.");
    }
    async getPhoto(options) {
      return new Promise(async (resolve2, reject) => {
        if (options.webUseInput || options.source === CameraSource.Photos) {
          this.fileInputExperience(options, resolve2, reject);
        } else if (options.source === CameraSource.Prompt) {
          let actionSheet = document.querySelector("pwa-action-sheet");
          if (!actionSheet) {
            actionSheet = document.createElement("pwa-action-sheet");
            document.body.appendChild(actionSheet);
          }
          actionSheet.header = options.promptLabelHeader || "Photo";
          actionSheet.cancelable = false;
          actionSheet.options = [
            { title: options.promptLabelPhoto || "From Photos" },
            { title: options.promptLabelPicture || "Take Picture" }
          ];
          actionSheet.addEventListener("onSelection", async (e) => {
            const selection = e.detail;
            if (selection === 0) {
              this.fileInputExperience(options, resolve2, reject);
            } else {
              this.cameraExperience(options, resolve2, reject);
            }
          });
        } else {
          this.cameraExperience(options, resolve2, reject);
        }
      });
    }
    async pickImages(_options) {
      return new Promise(async (resolve2, reject) => {
        this.multipleFileInputExperience(resolve2, reject);
      });
    }
    async cameraExperience(options, resolve2, reject) {
      await this._setupPWACameraModal(options.direction, (photo) => this._getCameraPhoto(photo, options), () => this.fileInputExperience(options, resolve2, reject), resolve2, reject);
    }
    fileInputExperience(options, resolve2, reject) {
      let input = document.querySelector("#_capacitor-camera-input");
      const cleanup = () => {
        var _a;
        (_a = input.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(input);
      };
      if (!input) {
        input = document.createElement("input");
        input.id = "_capacitor-camera-input";
        input.type = "file";
        input.hidden = true;
        document.body.appendChild(input);
        input.addEventListener("change", (_e) => {
          const file = input.files[0];
          let format = "jpeg";
          if (file.type === "image/png") {
            format = "png";
          } else if (file.type === "image/gif") {
            format = "gif";
          }
          if (options.resultType === "dataUrl" || options.resultType === "base64") {
            const reader = new FileReader();
            reader.addEventListener("load", () => {
              if (options.resultType === "dataUrl") {
                resolve2({
                  dataUrl: reader.result,
                  format
                });
              } else if (options.resultType === "base64") {
                const b64 = reader.result.split(",")[1];
                resolve2({
                  base64String: b64,
                  format
                });
              }
              cleanup();
            });
            reader.readAsDataURL(file);
          } else {
            resolve2({
              webPath: URL.createObjectURL(file),
              format
            });
            cleanup();
          }
        });
        input.addEventListener("cancel", (_e) => {
          reject(new CapacitorException("User cancelled photos app"));
          cleanup();
        });
      }
      input.accept = "image/*";
      input.capture = true;
      if (options.source === CameraSource.Photos || options.source === CameraSource.Prompt) {
        input.removeAttribute("capture");
      } else if (options.direction === CameraDirection.Front) {
        input.capture = "user";
      } else if (options.direction === CameraDirection.Rear) {
        input.capture = "environment";
      }
      input.click();
    }
    multipleFileInputExperience(resolve2, reject) {
      let input = document.querySelector("#_capacitor-camera-input-multiple");
      const cleanup = () => {
        var _a;
        (_a = input.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(input);
      };
      if (!input) {
        input = document.createElement("input");
        input.id = "_capacitor-camera-input-multiple";
        input.type = "file";
        input.hidden = true;
        input.multiple = true;
        document.body.appendChild(input);
        input.addEventListener("change", (_e) => {
          const photos = [];
          for (let i = 0; i < input.files.length; i++) {
            const file = input.files[i];
            let format = "jpeg";
            if (file.type === "image/png") {
              format = "png";
            } else if (file.type === "image/gif") {
              format = "gif";
            }
            photos.push({
              webPath: URL.createObjectURL(file),
              format
            });
          }
          resolve2({ photos });
          cleanup();
        });
        input.addEventListener("cancel", (_e) => {
          reject(new CapacitorException("User cancelled photos app"));
          cleanup();
        });
      }
      input.accept = "image/*";
      input.click();
    }
    _getCameraPhoto(photo, options) {
      return new Promise((resolve2, reject) => {
        const reader = new FileReader();
        const format = this._getFileFormat(photo);
        if (options.resultType === "uri") {
          resolve2({
            webPath: URL.createObjectURL(photo),
            format,
            saved: false
          });
        } else {
          reader.readAsDataURL(photo);
          reader.onloadend = () => {
            const r = reader.result;
            if (options.resultType === "dataUrl") {
              resolve2({
                dataUrl: r,
                format,
                saved: false
              });
            } else {
              resolve2({
                base64String: r.split(",")[1],
                format,
                saved: false
              });
            }
          };
          reader.onerror = (e) => {
            reject(e);
          };
        }
      });
    }
    async takePhotoCameraExperience(options, resolve2, reject) {
      await this._setupPWACameraModal(options.cameraDirection, (photo) => {
        var _a;
        return this._buildPhotoMediaResult(photo, (_a = options.includeMetadata) !== null && _a !== void 0 ? _a : false);
      }, () => this.takePhotoCameraInputExperience(options, resolve2, reject), resolve2, reject);
    }
    takePhotoCameraInputExperience(options, resolve2, reject) {
      const input = this._createFileInput("_capacitor-camera-input-takephoto");
      const cleanup = () => {
        var _a;
        (_a = input.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(input);
      };
      input.onchange = async (_e) => {
        var _a;
        if (!this._validateFileInput(input, reject, cleanup)) {
          return;
        }
        const file = input.files[0];
        resolve2(await this._buildPhotoMediaResult(file, (_a = options.includeMetadata) !== null && _a !== void 0 ? _a : false));
        cleanup();
      };
      input.oncancel = () => {
        reject(new CapacitorException("User cancelled photos app"));
        cleanup();
      };
      input.accept = "image/*";
      if (options.cameraDirection === CameraDirection.Front) {
        input.capture = "user";
      } else {
        input.capture = "environment";
      }
      input.click();
    }
    galleryInputExperience(options, resolve2, reject) {
      var _a, _b;
      const input = this._createFileInput("_capacitor-camera-input-gallery");
      input.multiple = (_a = options.allowMultipleSelection) !== null && _a !== void 0 ? _a : false;
      const cleanup = () => {
        var _a2;
        (_a2 = input.parentNode) === null || _a2 === void 0 ? void 0 : _a2.removeChild(input);
      };
      input.onchange = async (_e) => {
        var _a2;
        if (!this._validateFileInput(input, reject, cleanup)) {
          return;
        }
        const results = [];
        for (let i = 0; i < input.files.length; i++) {
          const file = input.files[i];
          if (file.type.startsWith("image/")) {
            results.push(await this._buildPhotoMediaResult(file, (_a2 = options.includeMetadata) !== null && _a2 !== void 0 ? _a2 : false));
          } else if (file.type.startsWith("video/")) {
            const format = this._getFileFormat(file);
            let thumbnail;
            let resolution;
            let duration;
            try {
              const videoInfo = await this._getVideoMetadata(file);
              thumbnail = videoInfo.thumbnail;
              if (options.includeMetadata) {
                resolution = videoInfo.resolution;
                duration = videoInfo.duration;
              }
            } catch (e) {
              console.warn("Failed to get video metadata:", e);
            }
            const result = {
              type: MediaType.Video,
              thumbnail,
              webPath: URL.createObjectURL(file),
              saved: false
            };
            if (options.includeMetadata) {
              result.metadata = {
                format,
                resolution,
                size: file.size,
                creationDate: new Date(file.lastModified).toISOString(),
                duration
              };
            }
            results.push(result);
          }
        }
        resolve2({ results });
        cleanup();
      };
      input.oncancel = () => {
        reject(new CapacitorException("User cancelled photos app"));
        cleanup();
      };
      const mediaType = (_b = options.mediaType) !== null && _b !== void 0 ? _b : MediaTypeSelection.Photo;
      if (mediaType === MediaTypeSelection.Photo) {
        input.accept = "image/*";
      } else if (mediaType === MediaTypeSelection.Video) {
        input.accept = "video/*";
      } else {
        input.accept = "image/*,video/*";
      }
      input.click();
    }
    _getFileFormat(file) {
      if (file.type === "image/png") {
        return "png";
      } else if (file.type === "image/gif") {
        return "gif";
      } else if (file.type.startsWith("video/")) {
        return file.type.split("/")[1];
      } else if (file.type.startsWith("image/")) {
        return "jpeg";
      }
      return file.type.split("/")[1] || "jpeg";
    }
    async _buildPhotoMediaResult(file, includeMetadata) {
      const format = this._getFileFormat(file);
      const thumbnail = await this._getBase64FromFile(file);
      const result = {
        type: MediaType.Photo,
        thumbnail,
        webPath: URL.createObjectURL(file),
        saved: false
      };
      if (includeMetadata) {
        const resolution = await this._getImageResolution(file);
        result.metadata = {
          format,
          resolution,
          size: file.size,
          creationDate: "lastModified" in file ? new Date(file.lastModified).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      return result;
    }
    _validateFileInput(input, reject, cleanup) {
      if (!input.files || input.files.length === 0) {
        const message = input.multiple ? "No files selected" : "No file selected";
        reject(new CapacitorException(message));
        cleanup();
        return false;
      }
      return true;
    }
    async _setupPWACameraModal(cameraDirection, onPhotoCallback, fallbackCallback, resolve2, reject) {
      if (customElements.get("pwa-camera-modal")) {
        const cameraModal = document.createElement("pwa-camera-modal");
        cameraModal.facingMode = cameraDirection === CameraDirection.Front ? "user" : "environment";
        document.body.appendChild(cameraModal);
        try {
          await cameraModal.componentOnReady();
          cameraModal.addEventListener("onPhoto", async (e) => {
            const photo = e.detail;
            if (photo === null) {
              reject(new CapacitorException("User cancelled photos app"));
            } else if (photo instanceof Error) {
              reject(photo);
            } else {
              resolve2(await onPhotoCallback(photo));
            }
            cameraModal.dismiss();
            document.body.removeChild(cameraModal);
          });
          cameraModal.present();
        } catch (e) {
          fallbackCallback();
        }
      } else {
        console.error(`Unable to load PWA Element 'pwa-camera-modal'. See the docs: https://capacitorjs.com/docs/web/pwa-elements.`);
        fallbackCallback();
      }
    }
    _createFileInput(id) {
      let input = document.querySelector(`#${id}`);
      if (!input) {
        input = document.createElement("input");
        input.id = id;
        input.type = "file";
        input.hidden = true;
        document.body.appendChild(input);
      }
      return input;
    }
    async _getImageResolution(image) {
      try {
        const bitmap = await createImageBitmap(image);
        const resolution = `${bitmap.width}x${bitmap.height}`;
        bitmap.close();
        return resolution;
      } catch (e) {
        console.warn("Failed to get image resolution:", e);
        return void 0;
      }
    }
    _getBase64FromFile(file) {
      return new Promise((resolve2, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result;
          const base64 = dataUrl.split(",")[1];
          resolve2(base64);
        };
        reader.onerror = (e) => {
          reject(e);
        };
        reader.readAsDataURL(file);
      });
    }
    _getVideoMetadata(videoFile) {
      return new Promise((resolve2) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.onloadedmetadata = () => {
          const seekTime = Math.min(1, video.duration * 0.1);
          video.currentTime = seekTime;
        };
        video.onseeked = () => {
          const result = {
            resolution: `${video.videoWidth}x${video.videoHeight}`,
            duration: video.duration
          };
          try {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              result.thumbnail = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
            }
          } catch (e) {
            console.warn("Failed to generate video thumbnail:", e);
          }
          URL.revokeObjectURL(video.src);
          resolve2(result);
        };
        video.onerror = () => {
          URL.revokeObjectURL(video.src);
          resolve2({});
        };
        video.src = URL.createObjectURL(videoFile);
      });
    }
    async checkPermissions() {
      if (typeof navigator === "undefined" || !navigator.permissions) {
        throw this.unavailable("Permissions API not available in this browser");
      }
      try {
        const permission = await window.navigator.permissions.query({
          name: "camera"
        });
        return {
          camera: permission.state,
          photos: "granted"
        };
      } catch (_a) {
        throw this.unavailable("Camera permissions are not available in this browser");
      }
    }
    async requestPermissions() {
      throw this.unimplemented("Not implemented on web.");
    }
    async pickLimitedLibraryPhotos() {
      throw this.unavailable("Not implemented on web.");
    }
    async getLimitedLibraryPhotos() {
      throw this.unavailable("Not implemented on web.");
    }
  };
  var Camera = new CameraWeb();

  // node_modules/@capacitor/camera/dist/esm/index.js
  var Camera2 = registerPlugin("Camera", {
    web: () => new CameraWeb()
  });

  // node_modules/@capacitor/filesystem/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor/synapse/dist/synapse.mjs
  function s(t) {
    t.CapacitorUtils.Synapse = new Proxy(
      {},
      {
        get(e, n) {
          return new Proxy({}, {
            get(w, o) {
              return (c, p, r) => {
                const i = t.Capacitor.Plugins[n];
                if (i === void 0) {
                  r(new Error(`Capacitor plugin ${n} not found`));
                  return;
                }
                if (typeof i[o] != "function") {
                  r(new Error(`Method ${o} not found in Capacitor plugin ${n}`));
                  return;
                }
                (async () => {
                  try {
                    const a = await i[o](c);
                    p(a);
                  } catch (a) {
                    r(a);
                  }
                })();
              };
            }
          });
        }
      }
    );
  }
  function u(t) {
    t.CapacitorUtils.Synapse = new Proxy(
      {},
      {
        get(e, n) {
          return t.cordova.plugins[n];
        }
      }
    );
  }
  function f(t = false) {
    typeof window > "u" || (window.CapacitorUtils = window.CapacitorUtils || {}, window.Capacitor !== void 0 && !t ? s(window) : window.cordova !== void 0 && u(window));
  }

  // node_modules/@capacitor/filesystem/dist/esm/index.js
  init_definitions();
  var Filesystem = registerPlugin("Filesystem", {
    web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.FilesystemWeb())
  });
  f();

  // node_modules/@capacitor/geolocation/dist/esm/index.js
  init_dist();
  var Geolocation2 = registerPlugin("Geolocation", {
    web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.GeolocationWeb())
  });
  f();

  // node_modules/@capacitor-community/speech-recognition/dist/esm/index.js
  init_dist();
  var SpeechRecognition2 = registerPlugin("SpeechRecognition", {
    web: () => Promise.resolve().then(() => (init_web3(), web_exports3)).then((m) => new m.SpeechRecognitionWeb())
  });

  // node_modules/@capacitor-community/text-to-speech/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor-community/text-to-speech/dist/esm/definitions.js
  var QueueStrategy;
  (function(QueueStrategy2) {
    QueueStrategy2[QueueStrategy2["Flush"] = 0] = "Flush";
    QueueStrategy2[QueueStrategy2["Add"] = 1] = "Add";
  })(QueueStrategy || (QueueStrategy = {}));

  // node_modules/@capacitor-community/text-to-speech/dist/esm/index.js
  var TextToSpeech = registerPlugin("TextToSpeech", {
    web: () => Promise.resolve().then(() => (init_web4(), web_exports4)).then((m) => new m.TextToSpeechWeb())
  });
  if ("speechSynthesis" in window) {
    window.speechSynthesis;
  }

  // node_modules/@capacitor-community/contacts/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor-community/contacts/dist/esm/definitions.js
  var PhoneType;
  (function(PhoneType2) {
    PhoneType2["Home"] = "home";
    PhoneType2["Work"] = "work";
    PhoneType2["Other"] = "other";
    PhoneType2["Custom"] = "custom";
    PhoneType2["Mobile"] = "mobile";
    PhoneType2["FaxWork"] = "fax_work";
    PhoneType2["FaxHome"] = "fax_home";
    PhoneType2["Pager"] = "pager";
    PhoneType2["Callback"] = "callback";
    PhoneType2["Car"] = "car";
    PhoneType2["CompanyMain"] = "company_main";
    PhoneType2["Isdn"] = "isdn";
    PhoneType2["Main"] = "main";
    PhoneType2["OtherFax"] = "other_fax";
    PhoneType2["Radio"] = "radio";
    PhoneType2["Telex"] = "telex";
    PhoneType2["TtyTdd"] = "tty_tdd";
    PhoneType2["WorkMobile"] = "work_mobile";
    PhoneType2["WorkPager"] = "work_pager";
    PhoneType2["Assistant"] = "assistant";
    PhoneType2["Mms"] = "mms";
  })(PhoneType || (PhoneType = {}));
  var EmailType;
  (function(EmailType2) {
    EmailType2["Home"] = "home";
    EmailType2["Work"] = "work";
    EmailType2["Other"] = "other";
    EmailType2["Custom"] = "custom";
    EmailType2["Mobile"] = "mobile";
  })(EmailType || (EmailType = {}));
  var PostalAddressType;
  (function(PostalAddressType2) {
    PostalAddressType2["Home"] = "home";
    PostalAddressType2["Work"] = "work";
    PostalAddressType2["Other"] = "other";
    PostalAddressType2["Custom"] = "custom";
  })(PostalAddressType || (PostalAddressType = {}));

  // node_modules/@capacitor-community/contacts/dist/esm/index.js
  var Contacts = registerPlugin("Contacts", {
    web: () => Promise.resolve().then(() => (init_web5(), web_exports5)).then((m) => new m.ContactsWeb())
  });

  // node_modules/@ebarooni/capacitor-calendar/dist/esm/index.js
  init_dist();

  // node_modules/@ebarooni/capacitor-calendar/dist/esm/schemas/enums/attendee-role.js
  var AttendeeRole;
  (function(AttendeeRole2) {
    AttendeeRole2["UNKNOWN"] = "unknown";
    AttendeeRole2["REQUIRED"] = "required";
    AttendeeRole2["OPTIONAL"] = "optional";
    AttendeeRole2["CHAIR"] = "chair";
    AttendeeRole2["NON_PARTICIPANT"] = "nonParticipant";
    AttendeeRole2["ATTENDEE"] = "attendee";
    AttendeeRole2["ORGANIZER"] = "organizer";
    AttendeeRole2["PERFORMER"] = "performer";
    AttendeeRole2["SPEAKER"] = "speaker";
  })(AttendeeRole || (AttendeeRole = {}));

  // node_modules/@ebarooni/capacitor-calendar/dist/esm/schemas/enums/attendee-status.js
  var AttendeeStatus;
  (function(AttendeeStatus2) {
    AttendeeStatus2["NONE"] = "none";
    AttendeeStatus2["ACCEPTED"] = "accepted";
    AttendeeStatus2["DECLINED"] = "declined";
    AttendeeStatus2["INVITED"] = "invited";
    AttendeeStatus2["UNKNOWN"] = "unknown";
    AttendeeStatus2["PENDING"] = "pending";
    AttendeeStatus2["TENTATIVE"] = "tentative";
    AttendeeStatus2["DELEGATED"] = "delegated";
    AttendeeStatus2["COMPLETED"] = "completed";
    AttendeeStatus2["IN_PROCESS"] = "inProcess";
  })(AttendeeStatus || (AttendeeStatus = {}));

  // node_modules/@ebarooni/capacitor-calendar/dist/esm/schemas/enums/attendee-type.js
  var AttendeeType;
  (function(AttendeeType2) {
    AttendeeType2["UNKNOWN"] = "unknown";
    AttendeeType2["PERSON"] = "person";
    AttendeeType2["ROOM"] = "room";
    AttendeeType2["RESOURCE"] = "resource";
    AttendeeType2["GROUP"] = "group";
    AttendeeType2["REQUIRED"] = "required";
    AttendeeType2["NONE"] = "none";
    AttendeeType2["OPTIONAL"] = "optional";
  })(AttendeeType || (AttendeeType = {}));

  // node_modules/@ebarooni/capacitor-calendar/dist/esm/schemas/enums/calendar-chooser-display-style.js
  var CalendarChooserDisplayStyle;
  (function(CalendarChooserDisplayStyle2) {
    CalendarChooserDisplayStyle2[CalendarChooserDisplayStyle2["ALL_CALENDARS"] = 0] = "ALL_CALENDARS";
    CalendarChooserDisplayStyle2[CalendarChooserDisplayStyle2["WRITABLE_CALENDARS_ONLY"] = 1] = "WRITABLE_CALENDARS_ONLY";
  })(CalendarChooserDisplayStyle || (CalendarChooserDisplayStyle = {}));

  // node_modules/@ebarooni/capacitor-calendar/dist/esm/schemas/enums/calendar-permission-scope.js
  var CalendarPermissionScope;
  (function(CalendarPermissionScope2) {
    CalendarPermissionScope2["READ_CALENDAR"] = "readCalendar";
    CalendarPermissionScope2["READ_REMINDERS"] = "readReminders";
    CalendarPermissionScope2["WRITE_CALENDAR"] = "writeCalendar";
    CalendarPermissionScope2["WRITE_REMINDERS"] = "writeReminders";
  })(CalendarPermissionScope || (CalendarPermissionScope = {}));

  // node_modules/@ebarooni/capacitor-calendar/dist/esm/schemas/enums/calendar-source-type.js
  var CalendarSourceType;
  (function(CalendarSourceType2) {
    CalendarSourceType2[CalendarSourceType2["LOCAL"] = 0] = "LOCAL";
    CalendarSourceType2[CalendarSourceType2["EXCHANGE"] = 1] = "EXCHANGE";
    CalendarSourceType2[CalendarSourceType2["CAL_DAV"] = 2] = "CAL_DAV";
    CalendarSourceType2[CalendarSourceType2["MOBILE_ME"] = 3] = "MOBILE_ME";
    CalendarSourceType2[CalendarSourceType2["SUBSCRIBED"] = 4] = "SUBSCRIBED";
    CalendarSourceType2[CalendarSourceType2["BIRTHDAYS"] = 5] = "BIRTHDAYS";
  })(CalendarSourceType || (CalendarSourceType = {}));

  // node_modules/@ebarooni/capacitor-calendar/dist/esm/schemas/enums/calendar-type.js
  var CalendarType;
  (function(CalendarType2) {
    CalendarType2[CalendarType2["LOCAL"] = 0] = "LOCAL";
    CalendarType2[CalendarType2["CAL_DAV"] = 1] = "CAL_DAV";
    CalendarType2[CalendarType2["EXCHANGE"] = 2] = "EXCHANGE";
    CalendarType2[CalendarType2["SUBSCRIPTION"] = 3] = "SUBSCRIPTION";
    CalendarType2[CalendarType2["BIRTHDAY"] = 4] = "BIRTHDAY";
  })(CalendarType || (CalendarType = {}));

  // node_modules/@ebarooni/capacitor-calendar/dist/esm/schemas/enums/event-availability.js
  var EventAvailability;
  (function(EventAvailability2) {
    EventAvailability2[EventAvailability2["NOT_SUPPORTED"] = -1] = "NOT_SUPPORTED";
    EventAvailability2[EventAvailability2["BUSY"] = 0] = "BUSY";
    EventAvailability2[EventAvailability2["FREE"] = 1] = "FREE";
    EventAvailability2[EventAvailability2["TENTATIVE"] = 2] = "TENTATIVE";
    EventAvailability2[EventAvailability2["UNAVAILABLE"] = 3] = "UNAVAILABLE";
  })(EventAvailability || (EventAvailability = {}));

  // node_modules/@ebarooni/capacitor-calendar/dist/esm/schemas/enums/event-span.js
  var EventSpan;
  (function(EventSpan2) {
    EventSpan2[EventSpan2["THIS_EVENT"] = 0] = "THIS_EVENT";
    EventSpan2[EventSpan2["THIS_AND_FUTURE_EVENTS"] = 1] = "THIS_AND_FUTURE_EVENTS";
  })(EventSpan || (EventSpan = {}));

  // node_modules/@ebarooni/capacitor-calendar/dist/esm/schemas/enums/event-status.js
  var EventStatus;
  (function(EventStatus2) {
    EventStatus2["NONE"] = "none";
    EventStatus2["CONFIRMED"] = "confirmed";
    EventStatus2["TENTATIVE"] = "tentative";
    EventStatus2["CANCELED"] = "canceled";
  })(EventStatus || (EventStatus = {}));

  // node_modules/@ebarooni/capacitor-calendar/dist/esm/schemas/enums/reminder-recurrence-frequency.js
  var ReminderRecurrenceFrequency;
  (function(ReminderRecurrenceFrequency2) {
    ReminderRecurrenceFrequency2[ReminderRecurrenceFrequency2["DAILY"] = 0] = "DAILY";
    ReminderRecurrenceFrequency2[ReminderRecurrenceFrequency2["WEEKLY"] = 1] = "WEEKLY";
    ReminderRecurrenceFrequency2[ReminderRecurrenceFrequency2["MONTHLY"] = 2] = "MONTHLY";
    ReminderRecurrenceFrequency2[ReminderRecurrenceFrequency2["YEARLY"] = 3] = "YEARLY";
  })(ReminderRecurrenceFrequency || (ReminderRecurrenceFrequency = {}));

  // node_modules/@ebarooni/capacitor-calendar/dist/esm/index.js
  var CapacitorCalendar = registerPlugin("CapacitorCalendar", {
    web: () => Promise.resolve().then(() => (init_web6(), web_exports6)).then((m) => new m.CapacitorCalendarWeb())
  });

  // node_modules/@capacitor/app/dist/esm/index.js
  init_dist();
  var App = registerPlugin("App", {
    web: () => Promise.resolve().then(() => (init_web7(), web_exports7)).then((m) => new m.AppWeb())
  });

  // src/native.js
  var isNative = Capacitor.isNativePlatform();
  async function requestAllPermissions() {
    const results = {};
    if (!isNative) return results;
    try {
      results.mic = (await SpeechRecognition2.requestPermissions()).speechRecognition;
    } catch (e) {
      results.mic = "error";
    }
    try {
      results.camera = (await Camera2.requestPermissions()).camera;
    } catch (e) {
      results.camera = "error";
    }
    try {
      results.contacts = (await Contacts.requestPermissions()).contacts;
    } catch (e) {
      results.contacts = "error";
    }
    try {
      results.location = (await Geolocation2.requestPermissions()).location;
    } catch (e) {
      results.location = "error";
    }
    try {
      results.calendar = (await CapacitorCalendar.requestFullCalendarAccess()).result;
    } catch (e) {
      results.calendar = "error";
    }
    return results;
  }
  var listeners = [];
  async function speechAvailable() {
    if (!isNative) return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    try {
      return (await SpeechRecognition2.available()).available;
    } catch (e) {
      return false;
    }
  }
  async function startListening(onFinalResult, onEnd) {
    if (!isNative) return false;
    try {
      listeners.forEach((l) => l.remove());
      listeners = [];
      const l1 = await SpeechRecognition2.addListener("partialResults", (data) => {
        if (data && data.matches && data.matches.length) {
          onFinalResult(data.matches[0]);
        }
      });
      const l2 = await SpeechRecognition2.addListener("listeningState", (data) => {
        if (data && data.status === "stopped") onEnd();
      });
      listeners.push(l1, l2);
      await SpeechRecognition2.start({
        language: "es-ES",
        partialResults: true,
        popup: false
      });
      return true;
    } catch (e) {
      console.warn("No se pudo iniciar el reconocimiento nativo:", e);
      onEnd();
      return false;
    }
  }
  async function stopListening() {
    if (!isNative) return;
    try {
      await SpeechRecognition2.stop();
    } catch (e) {
    }
  }
  async function speakNative(text) {
    if (!isNative) return false;
    try {
      await TextToSpeech.speak({ text, lang: "es-ES", rate: 0.95, pitch: 0.75, volume: 1 });
      return true;
    } catch (e) {
      console.warn("TTS nativo fall\xF3:", e);
      return false;
    }
  }
  async function stopSpeakingNative() {
    if (!isNative) return;
    try {
      await TextToSpeech.stop();
    } catch (e) {
    }
  }
  async function takePhoto() {
    const photo = await Camera2.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
      quality: 80
    });
    return photo.webPath;
  }
  async function saveNote(filename, content) {
    await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    });
    return filename;
  }
  async function listDocuments() {
    const res = await Filesystem.readdir({ path: "", directory: Directory.Documents });
    return res.files.map((f2) => f2.name);
  }
  async function getLocation() {
    const pos = await Geolocation2.getCurrentPosition({ enableHighAccuracy: true, timeout: 1e4 });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }
  async function findContact(name) {
    const { contacts } = await Contacts.getContacts({
      projection: { name: true, phones: true }
    });
    const n = name.toLowerCase();
    return contacts.find((c) => c.name && c.name.display && c.name.display.toLowerCase().includes(n));
  }
  function callNumber(number) {
    window.location.href = "tel:" + number.replace(/[^0-9+]/g, "");
  }
  async function createEvent(title, startDate, endDate) {
    const id = await CapacitorCalendar.createEvent({
      title,
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
      alerts: [-30]
    });
    return id;
  }
  function onAppReady(cb) {
    if (isNative) {
      App.addListener("appStateChange", () => {
      });
      document.addEventListener("deviceready", cb, false);
      if (document.readyState !== "loading") cb();
    } else {
      cb();
    }
  }
  window.Native = {
    isNative,
    requestAllPermissions,
    speechAvailable,
    startListening,
    stopListening,
    speakNative,
    stopSpeakingNative,
    takePhoto,
    saveNote,
    listDocuments,
    getLocation,
    findContact,
    callNumber,
    createEvent,
    onAppReady
  };
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
