// Copyright (c) TileDB, Inc.
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';
import * as BABYLON from "@babylonjs/core";

// Import the CSS
import '../css/widget.css';


export class BabylonJSModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: BabylonJSModel.model_name,
      _model_module: BabylonJSModel.model_module,
      _model_module_version: BabylonJSModel.model_module_version,
      _view_name: BabylonJSModel.view_name,
      _view_module: BabylonJSModel.view_module,
      _view_module_version: BabylonJSModel.view_module_version,
      extents: [],
      query: null,
      value: null,
      token: '',
      uri: '',
      width: 700,
      height: 500,
      wheel_precision: 50.0,
      z_scale: 0.5
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
  };

  static model_name = 'BabylonJSModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'BabylonJSView';
  static view_module = MODULE_NAME;
  static view_module_version = MODULE_VERSION;
}

export class BabylonJSView extends DOMWidgetView {
  render() {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loadingScreen';
    
    this.canvas = document.createElement('canvas');
    this.canvas.classList.add('renderCanvas');
    this.el.appendChild(this.canvas);

    this.model.on('change:query', this.query_changed, this);
    this.model.on_some_change(['width', 'height'], this.resizeCanvas, this);

    this.engine = new BABYLON.Engine(this.canvas, true);
    BABYLON.SceneLoader.ShowLoadingScreen = true;

    this.resizeCanvas();

    const scene = this.createScene();

    this.engine.runRenderLoop(function () {
      scene.render();
    });
  }

  protected createScene() {
    var scene = new BABYLON.Scene(this.engine);
    new BABYLON.PointLight("Point", new BABYLON.Vector3(5, 10, 5), scene);
    const camera = new BABYLON.ArcRotateCamera("Camera", 1, 0.8, 3, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(this.canvas, true);

    const data = JSON.parse(this.model.get('value'));    
    const extents = this.model.get('extents');
    const z_scale = this.model.get('z_scale');
    const wheel_precision = this.model.get('wheel_precision');
    const num_coords = data.X.length
    const minx = extents[0];
    const maxx = extents[1];
    const miny = extents[2];
    const maxy = extents[3];
    const minz = extents[4];
    const maxz = extents[5];

    camera.wheelPrecision = wheel_precision

    const pcs = new BABYLON.PointsCloudSystem("pcs", 1, scene, { updatable: false });
  
    const myLoader = function(particle:any, i:number, s:string) {
      particle.position = new BABYLON.Vector3(
        (data.X[i] - minx) / (maxx - minx),
        (data.Y[i] - miny) / (maxy - miny),
        ((data.Z[i] - minz) / (maxz - minz)) * z_scale);

      particle.color = new BABYLON.Color3(data.Red[i], data.Green[i], data.Blue[i]);
    };

    pcs.addPoints(num_coords, myLoader)
    pcs.buildMeshAsync();

    return scene;
  };

  protected resizeCanvas() {
    this.canvas.setAttribute('width', this.model.get('width'));
    this.canvas.setAttribute('height', this.model.get('height'));
    this.engine.resize();
  }

  protected query_changed() {
    // TODO
  }

  canvas: HTMLCanvasElement;
  engine: BABYLON.Engine;
}
