// In an AMD module, we set the public path using the magic requirejs 'module' dependency
// See https://github.com/requirejs/requirejs/wiki/Differences-between-the-simplified-CommonJS-wrapper-and-standard-AMD-define#module
// Since 'module' is a requirejs magic module, we must include 'module' in the webpack externals configuration.
import * as module from 'module';
const url = new URL(module.uri, document.location);

url.pathname = url.pathname.slice(0, url.pathname.lastIndexOf('/voila/'));
__webpack_public_path__ = `${url.origin}${url.pathname}/voila/templates/tiledb/static/babylonjs/`;
