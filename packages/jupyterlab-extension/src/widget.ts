// Copyright 2022 TileDB Inc.
// Licensed under the MIT License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';
import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  Scene,
  SceneLoader,
  StandardMaterial,
  SolidParticleSystem,
  MeshBuilder,
  Vector3,
  Texture,
} from '@babylonjs/core';
import { TileDBPointCloudVis } from '@tiledb-inc/babylonjs-core';
import '@babylonjs/loaders/glTF';
import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '../css/widget.css';
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
  engine?: Engine;
  values = this.model.get('value');
  width = this.values.width;
  height = this.values.height;
  wheelPrecision = this.values.wheel_precision;
  moveSpeed = this.values.move_speed;
  zScale = this.values.z_scale;
  inspector = this.values.inspector;

  protected resizeCanvas(): void {
    this.canvas?.setAttribute('width', this.width);
    this.canvas?.setAttribute('height', this.height);
    this.engine?.resize();
  }

  protected query_changed(): void {
    // TODO
  }

  protected async createScene(): Promise<Scene> {
    const scene = new Scene(this.engine as Engine);

    if (this.inspector) {
      scene.debugLayer.show({
        embedMode: true
      });
    }

    return scene;
  }

  render(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.classList.add('renderCanvas');
    this.el.appendChild(this.canvas);

    this.model.on('change:query', this.query_changed, this);
    this.model.on_some_change(['width', 'height'], this.resizeCanvas, this);

    this.engine = new Engine(this.canvas, true);

    const engine = this.engine;

    SceneLoader.ShowLoadingScreen = false;

    this.resizeCanvas();

    // window resize event handler
    window.addEventListener('resize', () => {
      this.engine?.resize();
    });

    this.createScene().then(scene => {
      engine.runRenderLoop(() => {
        scene.render();
      });
    });
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
    console.log(this.values);
    const pointCloudVisualization = new TileDBPointCloudVis({
      ...this.values,
      mode: this.values.mode,
      width: this.values.width,
      height: this.values.height,
      wheelPrecision: this.values.wheel_precision,
      moveSpeed: this.values.move_speed,
      zScale: this.values.z_scale,
      inspector: this.values.inspector,
      rootElement: this.el,
      values: this.values,
    });
    pointCloudVisualization.render();
    this.model.on_some_change(['width', 'height'], pointCloudVisualization.resizeCanvas, pointCloudVisualization);
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
  protected async createScene(): Promise<Scene> {
    return super.createScene().then(scene => {
      const data = this.values.data;
      const extents = this.values.extents;
      const minx = extents[0];
      const maxx = extents[1];
      const miny = extents[2];
      const maxy = extents[3];
      const minz = extents[4];
      const xy_length = Math.min(
        Math.max(maxx) - Math.min(minx),
        Math.max(maxy) - Math.min(miny)
      );
      const scale = this.zScale;

      // set up camera
      scene.createDefaultCameraOrLight(true, true, true);
      const camera = scene.activeCamera as ArcRotateCamera;
      camera.alpha += Math.PI;
      camera.upperBetaLimit = Math.PI / 2;
      camera.panningAxis = new Vector3(1, 1, 0);
      camera.panningSensibility = 0.9;
      camera.panningInertia = 0.2;
      camera._panningMouseButton = 0;

      if (this.wheelPrecision > 0) {
        camera.wheelPrecision = this.wheelPrecision;
      }

      camera.setTarget(
        new Vector3(
          ((maxx + minx) / 2 - minx) / xy_length,
          0,
          ((maxy + miny) / 2 - miny) / xy_length
        )
      );
      camera.attachControl(this.canvas, false);

      const mat = new StandardMaterial('mt1', scene);
      mat.alpha = 0.85;
      mat.diffuseColor = new Color3(0, 0, 0);
      mat.emissiveColor = new Color3(0.5, 0.5, 0.5);

      // create initial particles
      const SPS = new SolidParticleSystem('SPS', scene, {
        enableDepthSort: true
      });
      const box = MeshBuilder.CreateBox('b', { height: 1, width: 1, depth: 1 });
      SPS.addShape(box, data.Xmin.length);
      const mesh = SPS.buildMesh();
      mesh.material = mat;
      box.dispose();

      // add dimensions and a random color to each of the particles
      SPS.initParticles = () => {
        for (let p = 0; p < SPS.nbParticles; p++) {
          const particle = SPS.particles[p];
          particle.position.x =
            ((data.Xmax[p] + data.Xmin[p]) / 2 - minx) / xy_length;
          particle.position.y =
            (((data.Zmax[p] + data.Zmin[p]) / 2 - minz) / xy_length) * scale;
          particle.position.z =
            ((data.Ymax[p] + data.Ymin[p]) / 2 - miny) / xy_length;
          particle.scaling.x = (data.Xmax[p] - data.Xmin[p]) / xy_length;
          particle.scaling.y =
            ((data.Zmax[p] - data.Zmin[p]) / xy_length) * scale;
          particle.scaling.z = (data.Ymax[p] - data.Ymin[p]) / xy_length;
          particle.color = new Color4(
            0.5 + Math.random() * 0.6,
            0.5 + Math.random() * 0.6,
            0.5 + Math.random() * 0.6,
            0.9
          );
        }
      };

      // update SPS mesh
      SPS.initParticles();
      SPS.setParticles();

      // animation
      scene.registerBeforeRender(() => {
        SPS.setParticles();
      });

      return scene;
    });
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
  protected async createScene(): Promise<Scene> {
    return super.createScene().then(scene => {
      const data = this.values.data;
      const bbox = this.values.xy_bbox;

      scene.createDefaultCameraOrLight(true, true, true);
      scene.clearColor = new Color4(0.95, 0.94, 0.92, 1);

      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);

      const groundMaterial = new StandardMaterial('ground', scene);
      groundMaterial.diffuseTexture = new Texture(url, scene);
      groundMaterial.ambientTexture = new Texture(url, scene);
      groundMaterial.ambientColor = new Color3(0.5, 0.5, 0.5);
      groundMaterial.diffuseColor = new Color3(0.8, 0.8, 0.8);
      groundMaterial.specularColor = new Color3(0.5, 0.5, 0.5);
      groundMaterial.specularPower = 32;

      const xmin = bbox[0];
      const xmax = bbox[1];
      const ymin = bbox[2];
      const ymax = bbox[3];

      const ground = MeshBuilder.CreateGround(
        'ground',
        {
          height: (xmax - xmin) * 0.005,
          width: (ymax - ymin) * 0.005,
          subdivisions: 36
        },
        scene
      );
      ground.material = groundMaterial;

      const camera = scene.activeCamera as ArcRotateCamera;
      camera.panningAxis = new Vector3(1, 1, 0);
      camera.upperBetaLimit = Math.PI / 2;
      camera.panningSensibility = 1;
      camera.panningInertia = 0.2;
      camera._panningMouseButton = 0;

      if (this.wheelPrecision > 0) {
        camera.wheelPrecision = this.wheelPrecision;
      }

      camera.alpha += Math.PI;
      camera.attachControl(this.canvas, false);

      return scene;
    });
  }
}
