// Copyright (c) TileDB, Inc.
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';
import * as BABYLON from '@babylonjs/core';
import * as GUI from 'babylonjs-gui';

// Import the CSS
import '../css/widget.css';

export class BabylonPCModel extends DOMWidgetModel {
  defaults(): any {
    return {
      ...super.defaults(),
      _model_name: BabylonPCModel.model_name,
      _model_module: BabylonPCModel.model_module,
      _model_module_version: BabylonPCModel.model_module_version,
      _view_name: BabylonPCModel.view_name,
      _view_module: BabylonPCModel.view_module,
      _view_module_version: BabylonPCModel.view_module_version,
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers
  };

  static model_name = 'BabylonPCModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'BabylonPCView';
  static view_module = MODULE_NAME;
  static view_module_version = MODULE_VERSION;
}

export class BabylonPCView extends DOMWidgetView {
  canvas?: HTMLCanvasElement;
  engine?: BABYLON.Engine;

  render(): void {
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

    this.engine.runRenderLoop(() => {
      scene.render();
    });
  }

  protected createScene(): BABYLON.Scene {
    const scene = new BABYLON.Scene(this.engine as BABYLON.Engine);
    
    const values = this.model.get('value');
    const z_scale = values.z_scale;
    const extents = values.extents;
    const data = values.data;
    const minx = extents[0];
    const maxx = extents[1];
    const miny = extents[2];
    const maxy = extents[3];
    const minz = extents[4];
    const maxz = extents[5];
    const num_coords = data.X.length;    
    
    //const wheel_precision = this.model.get('wheel_precision');
    //const add_mode = this.model.get('add');
    const wheel_precision = 50.0;
    const add_mode = false;

    new BABYLON.PointLight('Point', new BABYLON.Vector3(5, 10, 5), scene);
  
    const xtarget = (((minx + maxx) / 2) - minx) / (maxx - minx);
    const ytarget = (((miny + maxy) / 2) - miny) / (maxy - miny);

    const camera = new BABYLON.ArcRotateCamera(
      'Camera',
      1,
      0.8,
      2,
      new BABYLON.Vector3(xtarget, ytarget, 0),
      scene
    );

    camera.setPosition(new BABYLON.Vector3(0, -2, 2));
    camera.attachControl(this.canvas, true);
    camera.wheelPrecision = wheel_precision;

    var pcs = new BABYLON.PointsCloudSystem('pcs', 1, scene, {
      updatable: true
    });

    var dim4_name: string = '';

    if (Object.keys(data).length === 7) {
      const panel = new GUI.StackPanel();
      panel.width = '200px';
      panel.height = '40px';
      panel.paddingLeft = '5px';
      panel.paddingRight = '5px';
      panel.isVertical = true;
      panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;

      for (var dim_key of Object.keys(data)) {
        if (['X', 'Y', 'Z', 'Red', 'Green', 'Blue'].indexOf(dim_key) === -1) {
          dim4_name = dim_key;
          break;
        }
      }

      var header: any = null;
      var dim4_vals: any = null;

      if (dim4_name.length > 0) {
        dim4_vals = data[dim4_name];
        header = new GUI.TextBlock();
        header.text = dim4_vals[0];
        header.height = '20px';
        header.fontSize = '14px';
        header.color = 'whitesmoke';
        header.textHorizontalAlignment =
          GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        header.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        header.paddingTop = '2px';
        header.paddingBottom = '2px';
      }

      const slider = new GUI.Slider(dim4_name);
      slider.height = '18px';
      slider.width = '200px';
      slider.paddingBottom = '2px';
      slider.borderColor = 'black';
      slider.color = 'orange';
      slider.background = 'grey';
      slider.minimum = 0;
      slider.maximum = data.X.length - 1;
      slider.step = 1;
      slider.value = 0;

      pcs.updateParticle = function (particle: any) {
        if (particle.position.z < 1.1) {
          particle.position = particle.position.add(
            new BABYLON.Vector3(0, 0, 999999)
          );
        } else {
          particle.position = particle.position.subtract(
            new BABYLON.Vector3(0, 0, 999999)
          );
        }
        return particle;
      };

      var prev_value = 0;

      const noAddModeReloader = function (value: number) {
        var prev_ptl_st = 0;
        var prev_ptl_end = 0;
        for (var kk = 0; kk <= prev_value; kk++) {
          if (kk < prev_value) {
            prev_ptl_st += data.X[kk].length;
            prev_ptl_end += data.X[kk].length;
          } else {
            prev_ptl_end += data.X[kk].length;
          }
        }
        var curr_ptl_st = 0;
        var curr_ptl_end = 0;
        for (var jk = 0; jk <= value; jk++) {
          if (jk < value) {
            curr_ptl_st += data.X[jk].length;
            curr_ptl_end += data.X[jk].length;
          } else {
            curr_ptl_end += data.X[jk].length;
          }
        }
        prev_value = value;

        if (header) {
          header.text = dim4_vals[value];
        }
        pcs.setParticles(prev_ptl_st, prev_ptl_end - 1);
        pcs.setParticles(curr_ptl_st, curr_ptl_end - 1);
      };

      const addModeReloader = function (value: number) {
        var start_i = prev_value < value ? prev_value : value;
        var end_i = value > prev_value ? value : prev_value;

        var start_ptl = 0;
        var end_ptl = 0;

        for (var ii = 0; ii <= end_i; ii++) {
          if (ii <= start_i) {
            start_ptl += data.X[ii].length;
            end_ptl += data.X[ii].length;
          } else {
            end_ptl += data.X[ii].length;
          }
        }
        prev_value = value;

        if (header) {
          header.text = dim4_vals[value];
        }

        pcs.setParticles(start_ptl, end_ptl - 1);
      };

      if (!add_mode) {
        slider.onValueChangedObservable.add(noAddModeReloader);
      } else {
        slider.onValueChangedObservable.add(addModeReloader);
      }

      const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
        'ui',
        true,
        scene
      );
      advancedTexture.addControl(panel);
      if (header) {
        panel.addControl(header);
      }
      panel.addControl(slider);

      const data_flat = {
        X: data.X.flat(),
        Y: data.Y.flat(),
        Z: data.Z.flat(),
        Red: data.Red.flat(),
        Green: data.Green.flat(),
        Blue: data.Blue.flat()
      };

      const initialLoader = function (particle: any, i: number, s: string) {
        particle.position = new BABYLON.Vector3(
          (data_flat.X[i] - minx) / (maxx - minx),
          (data_flat.Y[i] - miny) / (maxy - miny),
          ((data_flat.Z[i] - minz) / (maxz - minz)) * z_scale
        );

        particle.color = new BABYLON.Color3(
          data_flat.Red[i],
          data_flat.Green[i],
          data_flat.Blue[i]
        );
      };

      pcs.addPoints(data_flat.X.length, initialLoader);
      pcs.buildMeshAsync().then((mesh: BABYLON.Mesh) => {
        pcs.setParticles(data.X[0].length, data_flat.X.length);
      });
    } else {
      const threeDLoader = function (particle: any, i: number, s: string) {
        particle.position = new BABYLON.Vector3(
          (data.X[i] - minx) / (maxx - minx),
          (data.Y[i] - miny) / (maxy - miny),
          ((data.Z[i] - minz) / (maxz - minz)) * z_scale
        );

        particle.color = new BABYLON.Color3(
          data.Red[i],
          data.Green[i],
          data.Blue[i]
        );
      };

      pcs.addPoints(num_coords, threeDLoader);
      pcs.buildMeshAsync();
    }
    return scene;
  }  
  
  protected resizeCanvas(): void {
    const values = this.model.get('value');
    const width = values.width;
    const height = values.height;

    this.canvas?.setAttribute('width', width);
    this.canvas?.setAttribute('height', height);
    this.engine?.resize();
  }

  protected query_changed(): void {
    // TODO
  }
}

export class BabylonMBRSModel extends DOMWidgetModel {
  defaults(): any {
    return {
      ...super.defaults(),
      _model_name: BabylonMBRSModel.model_name,
      _model_module: BabylonMBRSModel.model_module,
      _model_module_version: BabylonMBRSModel.model_module_version,
      _view_name: BabylonMBRSModel.view_name,
      _view_module: BabylonMBRSModel.view_module,
      _view_module_version: BabylonMBRSModel.view_module_version,
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers
  };

  static model_name = 'BabylonMBRSModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'BabylonMBRSView';
  static view_module = MODULE_NAME;
  static view_module_version = MODULE_VERSION;
}

export class BabylonMBRSView extends DOMWidgetView {
  canvas?: HTMLCanvasElement;
  engine?: BABYLON.Engine;

  render(): void {
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

    this.engine.runRenderLoop(() => {
      scene.render();
    });
  }

  protected createScene(): BABYLON.Scene {
    const scene = new BABYLON.Scene(this.engine as BABYLON.Engine);

    const values = this.model.get('value');
    const data = values.data;
    const z_scale = values.z_scale;
    const extents = values.extents;
    const minx = extents[0];
    const maxx = extents[1];
    const miny = extents[2];
    const maxy = extents[3];

    const wheel_precision = 50.0;
    
    //const camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 4, Math.PI / 4, 4, BABYLON.Vector3.Zero(), scene);
    //camera.attachControl(this.canvas, true);
    //var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 0.5, 0), scene);
    //light.intensity = 0.8;

    //scene.clearColor = new BABYLON.Color4(0.2, 0.4, 0.8, 1.0);

    new BABYLON.PointLight('Point', new BABYLON.Vector3(0, -2, 2), scene);
    //new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, -2, 2), scene);

    const xtarget = (((minx + maxx) / 2) - minx) / (maxx - minx);
    const ytarget = (((miny + maxy) / 2) - miny) / (maxy - miny);
    
    const camera = new BABYLON.ArcRotateCamera(
      'Camera',
      1,
      0.8,
      2,
      new BABYLON.Vector3(xtarget, ytarget, 0),
      scene
    );

    camera.setPosition(new BABYLON.Vector3(0, -2, 2));
    camera.attachControl(this.canvas, true);
    camera.wheelPrecision = wheel_precision;

    const mat = new BABYLON.StandardMaterial('mt1', scene);
    //mat.disableLighting = true;
    //mat.alpha = 0.9;

    const SPS = new BABYLON.SolidParticleSystem("SPS", scene);
    const box = BABYLON.MeshBuilder.CreateBox("b", {height: 1, width: 1, depth: 1});
    SPS.addShape(box, data.X.length); 
    box.dispose(); //dispose of original model box
  
    SPS.buildMesh(); // finally builds and displays the SPS mesh

    SPS.initParticles = () => {
      for (let p = 0; p < SPS.nbParticles; p++) {
          const particle = SPS.particles[p];
          particle.position.x = data.X[p];
          particle.position.y = data.Y[p];
          particle.position.z = data.Z[p] * z_scale;
          particle.scaling.x = data.W[p];
          particle.scaling.y = data.D[p];
          particle.scaling.z = data.H[p] * z_scale;
          particle.color = new BABYLON.Color4(0.5 + Math.random() * 0.6, 0.5 + Math.random() * 0.6, 0.5 + Math.random() * 0.6,0.9);
      }
    };

    SPS.mesh.hasVertexAlpha = true;
    SPS.initParticles(); //call the initialising function
    SPS.setParticles(); //apply the properties and display the mesh
    SPS.mesh.material = mat;

    return scene;
  }

  protected resizeCanvas(): void {
    const values = this.model.get('value');
    const width = values.width;
    const height = values.height;

    this.canvas?.setAttribute('width', width);
    this.canvas?.setAttribute('height', height);
    this.engine?.resize();
  }

  protected query_changed(): void {
    // TODO
  }
}