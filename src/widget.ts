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
      mode: this.values.mode,
      colorScheme: this.values.color_scheme,
      data: this.values.data,
      zScale: this.values.z_scale,
      gltfData: this.values.gltf_data,
      topoOffset: this.values.topo_offset,
      classes: this.values.classes,
      timeOffset: this.values.time_offset,
      distanceColors: this.values.distance_colors,
      meshRotation: this.values.mesh_rotation,
      meshShift: this.values.mesh_shift,
      meshScale: this.values.mesh_scale,
      gltfMulti: this.values.gltf_multi,
      source: this.values.source,
      showFraction: this.values.show_fraction,
      pointShift: this.values.point_shift,
      rgbMax: this.values.rgb_max,
      bbox: this.values.bbox,
      namespace: this.values.name_space,
      arrayName: this.values.array_name,
      tiledbEnv: this.values.tiledb_env,
      token: this.values.token,
      bufferSize: this.values.buffer_size,
      streaming: this.values.streaming,
      maxLevel: this.values.max_levels,
      pointType: this.values.point_type,
      pointSize: this.values.point_size,
      pointScale: this.values.point_scale,
      pointBudget: this.values.point_budget,
      cameraRadius: this.values.camera_radius,
      edlStrength: this.values.edl_strength,
      edlRadius: this.values.edl_radius,
      edlNeighbours: this.values.edl_neightbours,
      maxNumCacheBlocks: this.values.max_num_cache_blocks,
      fanOut: this.values.fan_out,
      useShader: this.values.use_shader,
      useGUI: this.values.use_gui,
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
      moveSpeed: this.values.move_speed,
      inspector: this.values.inspector,
      rootElement: this.el
    });

    this.visualization.render();
  }
}
