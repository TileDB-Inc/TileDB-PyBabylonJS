import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import * as widgetExports from './widget';
import { MODULE_NAME, MODULE_VERSION } from './version';

/**
 * Initialization data for the @tiledb-inc/pybabylonjs extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@tiledb-inc/pybabylonjs:plugin',
  requires: [IJupyterWidgetRegistry as any],
  autoStart: true,
  activate: activateWidgetExtension
};

export default plugin;

/**
 * Activate the widget extension.
 */
function activateWidgetExtension(
  __: JupyterFrontEnd,
  registry: IJupyterWidgetRegistry
): void {
  registry.registerWidget({
    name: MODULE_NAME,
    version: MODULE_VERSION,
    exports: widgetExports
  });
}
