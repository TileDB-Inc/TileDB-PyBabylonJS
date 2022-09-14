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
  TileDBImageVisualization,
  TileDBMBRSVisualization,
  TileDBPointCloudVisualization,
  TileDBVisualization
} from '@tiledb-inc/viz-core';

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
  visualization?: TileDBVisualization;
  values = this.model.get('value');
  width = this.values.width;
  height = this.values.height;
  wheelPrecision = this.values.wheel_precision;
  inspector = this.values.inspector;

  protected resizeCanvas(): void {
    this.visualization?.resizeCanvas({
      width: this.width,
      height: this.height
    });
  }

  protected query_changed(): void {
    // TODO
  }
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
    this.visualization = new TileDBPointCloudVisualization({
      data: this.values.data,
      width: this.values.width,
      height: this.values.height,
      wheelPrecision: this.values.wheel_precision,
      inspector: this.values.inspector,
      rootElement: this.el,
      mode: this.values.mode,
      source: this.values.source,
      particleSize: this.values.particle_size,
      particleType: this.values.particle_type,
      pointBudget: this.values.point_budget,
      refreshRate: this.values.refresh_rate,
      cameraRadius: this.values.camera_radius,
      bbox: this.values.bbox,
      rgbMax: this.values.rgb_max,
      namespace: this.values.name_space,
      arrayName: this.values.array_name,
      token: this.values.token,
      showFraction: this.values.show_fraction,
      colorScheme: this.values.color_scheme,
      pointShift: this.values.point_shift,
      zScale: this.values.z_scale
    });

    this.visualization.render();
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
    this.visualization = new TileDBMBRSVisualization({
      data: this.values.data,
      extents: this.values.extents,
      width: this.values.width,
      height: this.values.height,
      wheelPrecision: this.values.wheel_precision,
      zScale: this.values.z_scale,
      inspector: this.values.inspector,
      rootElement: this.el
    });
    this.visualization.render();
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
    this.visualization = new TileDBImageVisualization({
      data: this.values.data,
      width: this.values.width,
      xyBbox: this.values.xy_bbox,
      height: this.values.height,
      wheelPrecision: this.values.wheel_precision,
      inspector: this.values.inspector,
      rootElement: this.el
    });

    this.visualization.render();
  }
}
