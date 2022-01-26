// Copyright (c) TileDB, Inc.
// Distributed under the terms of the Modified BSD License.

import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';

import * as widgetExports from './widget';

import { MODULE_NAME, MODULE_VERSION } from './version';

const EXTENSION_ID = 'PyBabylonJS:plugin';

/**
 * The pybabylonjs plugin.
 */
const pybabylonjsPlugin: any = {
  id: EXTENSION_ID,
  requires: [IJupyterWidgetRegistry],
  activate: activateWidgetExtension,
  autoStart: true
};

export default pybabylonjsPlugin;

/**
 * Activate the widget extension.
 */
function activateWidgetExtension(
  __: any,
  registry: IJupyterWidgetRegistry
): void {
  registry.registerWidget({
    name: MODULE_NAME,
    version: MODULE_VERSION,
    exports: widgetExports
  });
}
