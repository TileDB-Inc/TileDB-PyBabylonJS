// Copyright 2022 TileDB Inc.
// Licensed under the MIT License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';
import '../css/widget.css';
import {
  TileDBMBRSVisualization,
  TileDBPointCloudVisualization,
  TileDBImageVisualization
} from '@tiledb-inc/visualizations';

export class BabylonBaseModel extends DOMWidgetModel {
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_module = MODULE_NAME;
  static view_module_version = MODULE_VERSION;

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers
  };
}

abstract class BabylonBaseView extends DOMWidgetView {
  canvas?: HTMLCanvasElement;
  // engine?: Engine;
  values = this.model.get('value');
  width = this.values.width;
  height = this.values.height;
  wheelPrecision = this.values.wheel_precision;
  moveSpeed = this.values.move_speed;
  zScale = this.values.z_scale;
  inspector = this.values.inspector;
}

export class BabylonPointCloudModel extends BabylonBaseModel {
  defaults(): any {
    return {
      ...super.defaults(),
      _model_name: BabylonPointCloudModel.model_name,
      _model_module: BabylonPointCloudModel.model_module,
      _model_module_version: BabylonPointCloudModel.model_module_version,
      _view_name: BabylonPointCloudModel.view_name,
      _view_module: BabylonPointCloudModel.view_module,
      _view_module_version: BabylonPointCloudModel.view_module_version
    };
  }

  static model_name = 'BabylonPointCloudModel';
  static view_name = 'BabylonPointCloudView';
}
export class BabylonPointCloudView extends BabylonBaseView {
  render() {
    console.log(this.values);
    const pointCloudVisualization = new TileDBPointCloudVisualization({
      ...this.values,
      mode: this.values.mode,
      width: this.values.width,
      height: this.values.height,
      wheelPrecision: this.values.wheel_precision,
      moveSpeed: this.values.move_speed,
      zScale: this.values.z_scale,
      inspector: this.values.inspector,
      rootElement: this.el,
      values: this.values
    });
    pointCloudVisualization.render();
    // this.model.on_some_change(['width', 'height'], pointCloudVisualization.resizeCanvas, pointCloudVisualization);
  }
}
export class BabylonMBRSModel extends BabylonBaseModel {
  defaults(): any {
    return {
      ...super.defaults(),
      _model_name: BabylonMBRSModel.model_name,
      _model_module: BabylonMBRSModel.model_module,
      _model_module_version: BabylonMBRSModel.model_module_version,
      _view_name: BabylonMBRSModel.view_name,
      _view_module: BabylonMBRSModel.view_module,
      _view_module_version: BabylonMBRSModel.view_module_version
    };
  }

  static model_name = 'BabylonMBRSModel';
  static view_name = 'BabylonMBRSView';
}

export class BabylonMBRSView extends BabylonBaseView {
  render() {
    console.log(this.values);
    const mbrsVisualization = new TileDBMBRSVisualization({
      ...this.values,
      mode: this.values.mode,
      width: this.values.width,
      height: this.values.height,
      wheelPrecision: this.values.wheel_precision,
      moveSpeed: this.values.move_speed,
      zScale: this.values.z_scale,
      inspector: this.values.inspector,
      rootElement: this.el,
      values: this.values
    });
    mbrsVisualization.render();
    // this.model.on_some_change(['width', 'height'], pointCloudVisualization.resizeCanvas, pointCloudVisualization);
  }
}
export class BabylonImageModel extends BabylonBaseModel {
  defaults(): any {
    return {
      ...super.defaults(),
      _model_name: BabylonImageModel.model_name,
      _model_module: BabylonImageModel.model_module,
      _model_module_version: BabylonImageModel.model_module_version,
      _view_name: BabylonImageModel.view_name,
      _view_module: BabylonImageModel.view_module,
      _view_module_version: BabylonImageModel.view_module_version
    };
  }

  static model_name = 'BabylonImageModel';
  static view_name = 'BabylonImageView';
}

export class BabylonImageView extends BabylonBaseView {
  render() {
    const vis = new TileDBImageVisualization({
      ...this.values,
      mode: this.values.mode,
      width: this.values.width,
      height: this.values.height,
      wheelPrecision: this.values.wheel_precision,
      moveSpeed: this.values.move_speed,
      zScale: this.values.z_scale,
      inspector: this.values.inspector,
      rootElement: this.el,
      values: this.values
    });

    vis.render();
  }
}
