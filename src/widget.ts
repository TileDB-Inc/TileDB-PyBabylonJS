// Copyright (c) TileDB, Inc.
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';
import { ArcRotateCamera, Color3, Color4, Engine, PointsCloudSystem, Scene, SceneLoader, StandardMaterial,
  SolidParticleSystem, MeshBuilder,
  Vector3,
  Texture} from '@babylonjs/core';
import {AdvancedDynamicTexture, Control, StackPanel, Slider, TextBlock} from 'babylonjs-gui';
import "@babylonjs/loaders/glTF";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

// Import the CSS
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

    this.createScene().then( ( scene ) => {
      engine.runRenderLoop(() => {
        scene.render();
      });
    })
  }

  protected async createScene(): Promise<Scene> {
    const scene = new Scene(this.engine as Engine);

    if (this.inspector) {
      scene.debugLayer.show({
        embedMode: true,
      });
    }

    return scene;
  }

}

export class BabylonPCModel extends BabylonBaseModel {
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

  static model_name = 'BabylonPCModel';
  static view_name = 'BabylonPCView';
}

export class BabylonPCView extends BabylonBaseView {

  protected async createScene(): Promise<Scene> {
    return super.createScene().then( ( scene ) => {
      const data = this.values.data;
      const numCoords = data.X.length;
      const gltfData = this.values.gltf_data;
      const pointSize = this.values.point_size;
      const isTime = this.values.time;
      const isClass = this.values.classes;
      const scale = this.zScale;
      var doClear = false;

      if (isClass) {
        var pcs = new PointsCloudSystem('pcs', pointSize, scene, {
          updatable: isClass
        });
      }
      else {
        var pcs = new PointsCloudSystem('pcs', pointSize, scene, {
          updatable: isTime
        });
      }

      const pcLoader = function (particle: any, i: number, _: string) {
        // Y is up
        particle.position = new Vector3(
          data.X[i],
          data.Z[i] * scale,
          data.Y[i]
        );

        if (isTime) {
          particle.color = scene.clearColor;
        }
        else {
          particle.color = new Color3(
            data.Red[i],
            data.Green[i],
            data.Blue[i]
          );  
        }
      };

      pcs.addPoints(numCoords, pcLoader);

      let tasks:Promise<any>[] = [pcs.buildMeshAsync()];

      if (gltfData) {
        var blob = new Blob([gltfData]);
        var url = URL.createObjectURL(blob);
        tasks.push(SceneLoader.AppendAsync(url, "", scene, null, ".gltf"));
      }

      return Promise.all(tasks).then(() => {
        scene.createDefaultCameraOrLight(true, true, false);

        if (isTime) {
          const times = data.GpsTime;
          const offset = this.values.time_offset;

          var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI(
                "UI",
                true,
                scene);

          var panel = new StackPanel();
          panel.width = "220px";
          panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          advancedTexture.addControl(panel);

          var header = new TextBlock();
          header.text = "Time: " + (offset +  times[0]).toFixed(2);
          header.height = "30px";
          header.color = "white";
          panel.addControl(header);

          var slider = new Slider("GpsTime");
          slider.minimum = 0;
          slider.maximum = data.GpsTime.length - 1;
          slider.step = 1;
          slider.value = 0;
          slider.height = "20px";
          slider.width = "200px";

          pcs.updateParticle = function (particle: any) {
            if (doClear)
              particle.color = scene.clearColor;
            else
              particle.color = new Color3(
                data.Red[particle.idx],
                data.Green[particle.idx],
                data.Blue[particle.idx]
              );

            return particle;
          };

          slider.onValueChangedObservable.add(
            function(value:any) {
              header.text = "Time: " + (offset + times[value]).toFixed(2);

              if (value > pcs.counter) {
                doClear = false;
                pcs.setParticles(pcs.counter, value);
              } else {
                doClear = true;
                pcs.setParticles(value, pcs.counter);
              }
              pcs.counter = value;
          });
          
          panel.addControl(slider);    
        }

        if (isClass) {
          const classes = data.Class;
          const class_numbers = this.values.class_numbers;
          const class_names = this.values.class_names;

          var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI(
                "UI",
                true,
                scene);

          var panel = new StackPanel();
          panel.width = "220px";
          panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          advancedTexture.addControl(panel);

          var header = new TextBlock();
          var slider_classes: number[] = Array.from(new Set(classes))
          
          header.text = "All";
          header.height = "30px";
          header.color = "white";
          panel.addControl(header);

          var slider = new Slider("Classes");
          slider.minimum = 0;
          slider.maximum = slider_classes.length;
          slider.step = 1;
          slider.value = slider_classes[0];
          slider.height = "20px";
          slider.width = "200px";

          pcs.updateParticle = function (particle: any) {
            if (doClear)
              particle.color = scene.clearColor;
            else
             particle.color = new Color3(
                data.Red[particle.idx],
                data.Green[particle.idx],
                data.Blue[particle.idx]
              );

            return particle;
          };

          slider.onValueChangedObservable.add(
            function(value:any) {
              
              var v: number = class_numbers.indexOf(slider_classes[value]);
              header.text = class_names[v];

              var start = data.Class.indexOf(slider_classes[value]);
              var finish = data.Class.lastIndexOf(slider_classes[value]);

              doClear = true;
              pcs.setParticles(0, numCoords);

              doClear = false;
              pcs.setParticles(start, finish);
          });
          
          panel.addControl(slider);    
        }

        let camera = scene.activeCamera as ArcRotateCamera;
        // possibly make these configurable, but they are good defaults
        camera.panningAxis = new Vector3(1, 1, 0);
        camera.upperBetaLimit = Math.PI / 2;
        camera.panningSensibility = 1;
        camera.panningInertia = 0.2;
        camera._panningMouseButton = 0;

        if (this.wheelPrecision > 0)
          camera.wheelPrecision = this.wheelPrecision;

        camera.alpha += Math.PI;
        camera.attachControl(this.canvas, true);

        return scene;
      });
    });
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
      _view_module_version: BabylonMBRSModel.view_module_version,
    };
  }

  static model_name = 'BabylonMBRSModel';
  static view_name = 'BabylonMBRSView';
}

export class BabylonMBRSView extends BabylonBaseView {
  protected async createScene(): Promise<Scene> {
    return super.createScene().then( ( scene ) => {
      const data = this.values.data;
      const extents = this.values.extents;
      const minx = extents[0];
      const maxx = extents[1];
      const miny = extents[2];
      const maxy = extents[3];
      const minz = extents[4];
      const maxz = extents[5];
      const scale = this.zScale;
 
      var mat = new StandardMaterial('mt1', scene);
      mat.alpha = 0.9;

      const SPS = new SolidParticleSystem("SPS", scene);
      const box = MeshBuilder.CreateBox("b", {height: 1, width: 1, depth: 1});
      SPS.addShape(box, data.Xmin.length); 
      box.dispose(); 

      SPS.buildMesh(); 

      SPS.initParticles = () => {
        for (let p = 0; p < SPS.nbParticles; p++) {
            const particle = SPS.particles[p];
            particle.position.x = ((data.Xmax[p]+data.Xmin[p])/2 - minx) / (maxx - minx);
            particle.position.y = ((data.Ymax[p]+data.Ymin[p])/2 - miny) / (maxy - miny);
            particle.position.z = (((data.Zmax[p]+data.Zmin[p])/2 - minz) / (maxz - minz)) * scale;
            particle.scaling.x = (data.Xmax[p]-data.Xmin[p]) / (maxx - minx);
            particle.scaling.y = (data.Ymax[p]-data.Ymin[p]) / (maxy - miny);
            particle.scaling.z = ( (data.Zmax[p]-data.Zmin[p]) / (maxz - minz) ) * scale;
            particle.color = new Color4(0.5 + Math.random() * 0.6, 0.5 + Math.random() * 0.6, 0.5 + Math.random() * 0.6,0.9);
        }
      };

      SPS.mesh.hasVertexAlpha = true;
      SPS.initParticles(); 
      SPS.setParticles(); 
      SPS.mesh.material = mat;

      scene.createDefaultCameraOrLight(true, true, true);
      let cam = scene.activeCamera as ArcRotateCamera;
      cam.wheelPrecision = this.wheelPrecision;
      cam.alpha += Math.PI;

      return scene;
    });
  }
}

export class BabylonGroundModel extends BabylonBaseModel {
  defaults(): any {
    return {
      ...super.defaults(),
      _model_name: BabylonGroundModel.model_name,
      _model_module: BabylonGroundModel.model_module,
      _model_module_version: BabylonGroundModel.model_module_version,
      _view_name: BabylonGroundModel.view_name,
      _view_module: BabylonGroundModel.view_module,
      _view_module_version: BabylonGroundModel.view_module_version,
    };
  }

  static model_name = 'BabylonGroundModel';
  static view_name = 'BabylonGroundView';
}

export class BabylonGroundView extends BabylonBaseView {

  protected async createScene(): Promise<Scene> {
    return super.createScene().then( ( scene ) => {
      const data = this.values.data;
      const img_height = this.values.img_height;
      const img_width = this.values.img_width;

      scene.createDefaultCameraOrLight(true, true, true);
      scene.clearColor = new Color4(0.95, 0.94, 0.92, 1);
            
      var blob = new Blob([data]);
      var url = URL.createObjectURL(blob);
      
      const groundMaterial = new StandardMaterial("ground", scene);
      groundMaterial.diffuseTexture = new Texture(url, scene);
      groundMaterial.ambientTexture = new Texture(url, scene);
      groundMaterial.ambientColor = new Color3(0.5, 0.5, 0.5);
      groundMaterial.diffuseColor = new Color3(0.8, 0.8, 0.8);
      groundMaterial.specularColor = new Color3(0.5, 0.5, 0.5);
      groundMaterial.specularPower = 32;

      const ground = MeshBuilder.CreateGround("ground", {height: img_height*0.005, width: img_width*0.005, subdivisions: 16}, scene);
      ground.material = groundMaterial;
      
      let camera = scene.activeCamera as ArcRotateCamera;
      camera.panningAxis = new Vector3(1, 1, 0);
      camera.upperBetaLimit = Math.PI / 2;
      camera.panningSensibility = 1;
      camera.panningInertia = 0.2;
      camera._panningMouseButton = 0;
      
      if (this.wheelPrecision > 0)
        camera.wheelPrecision = this.wheelPrecision;

      camera.alpha += Math.PI;
      camera.attachControl(this.canvas, true);

      return scene;
    });
  }
}