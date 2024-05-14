// Copyright 2023 TileDB Inc.
// Licensed under the MIT License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';
import '../css/widget.css';
import {
  TileDBTileImageVisualization,
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
  moveSpeed = this.values.move_speed;
  inspector = this.values.inspector;

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
      width: this.values.width,
      height: this.values.height,
      wheelPrecision: this.values.wheel_precision,
      moveSpeed: this.values.move_speed,
      inspector: this.values.inspector,
      rootElement: this.el,
      //mode: this.values.mode,
      colorScheme: this.values.color_scheme,
      data: this.values.data,
      zScale: this.values.z_scale,
      //topoOffset: this.values.topo_offset,
      //classes: this.values.classes,
      //timeOffset: this.values.time_offset,
      source: this.values.source,
      //pointShift: this.values.point_shift,
      rgbMax: this.values.rgb_max,
      bbox: this.values.bbox,
      namespace: this.values.name_space,
      arrayName: this.values.array_name,
      groupName: this.values.group_name,
      tiledbEnv: this.values.tiledb_env,
      token: this.values.token,
      bufferSize: this.values.buffer_size,
      streaming: this.values.streaming,
      pointType: this.values.point_type,
      pointSize: this.values.point_size,
      pointBudget: this.values.point_budget,
      cameraLocation: this.values.camera_location,
      cameraZoomOut: this.values.camera_zoom,
      cameraUp: this.values.camera_up,
      edlStrength: this.values.edl_strength,
      edlRadius: this.values.edl_radius,
      edlNeighbours: this.values.edl_neightbours,
      useShader: this.values.use_shader,
      useSPS: this.values.use_sps,
      debug: this.values.debug,
      workerPoolSize: this.values.worker_pool_size
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
      moveSpeed: this.values.move_speed,
      zScale: this.values.z_scale,
      inspector: this.values.inspector,
      rootElement: this.el
    });
    this.visualization.render();
  }
}

export class BabylonTileImageModel extends BabylonBaseModel {
  defaults(): any {
    return {
      ...super.defaults(),
      _model_name: BabylonTileImageModel.model_name,
      _model_module: BabylonTileImageModel.model_module,
      _model_module_version: BabylonTileImageModel.model_module_version,
      _view_name: BabylonTileImageModel.view_name,
      _view_module: BabylonTileImageModel.view_module,
      _view_module_version: BabylonTileImageModel.view_module_version
    };
  }

  static model_name = 'BabylonTileImageModel';
  static view_name = 'BabylonTileImageView';
}

export class BabylonTileImageView extends BabylonBaseView {
  render() {
    this.visualization = new TileDBTileImageVisualization({
      engineAPI: this.values.engine_api,
      namespace: this.values.name_space,
      arrayID: this.values.array_name,
      groupID: this.values.group_name,
      geometryArrayID: this.values.geometry_array_names,
      pointGroupID: this.values.point_group_names,
      tileUris: this.values.tile_uris,
      baseGroup: this.values.base_group,
      token: this.values.token,
      tiledbEnv: this.values.tiledb_env,
      width: this.values.width,
      height: this.values.height,
      rootElement: this.el,
      defaultChannels: this.values.default_channels,
      sceneConfig: this.values.scene_config
    });

    this.visualization.render();
  }
}
