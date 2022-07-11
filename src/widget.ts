// Copyright 2022 TileDB Inc.
// Licensed under the MIT License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';
import { ArcRotateCamera, Color3, Color4, Engine, PointsCloudSystem, Scene, SceneLoader, StandardMaterial,
  SolidParticleSystem, MeshBuilder,
  Vector3,
  Texture,
  Axis,
  Ray,
  TransformNode,
  BoundingBoxGizmo,
  UtilityLayerRenderer,
  SixDofDragBehavior,
  MultiPointerScaleBehavior,
  } from '@babylonjs/core';
import {AdvancedDynamicTexture, Control, StackPanel, Slider, TextBlock} from 'babylonjs-gui';
import "@babylonjs/loaders/glTF";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

// Import the CSS
import '../css/widget.css';
import Client from '@tiledb-inc/tiledb-cloud';
import { Layout } from '@tiledb-inc/tiledb-cloud/lib/v1';
import { Mesh } from '@babylonjs/core/Meshes/mesh';

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
  wheelPrecision = 0.25; //this.values.wheel_precision;
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

    this.createScene().then(scene => {
      engine.runRenderLoop(() => {
        scene.render();
      });
    });
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
      _view_module_version: BabylonPointCloudModel.view_module_version,
    };
  }

  static model_name = 'BabylonPointCloudModel';
  static view_name = 'BabylonPointCloudView';
}

export class BabylonPointCloudView extends BabylonBaseView {
  // this is to keep all imported models on a common parent
  private _instances: TransformNode[] = new Array<TransformNode>();
  // take note of scene
  //private _scene!: Scene;

  protected async createScene(): Promise<Scene> {
    return super.createScene().then(async scene => {

      var isTime = false;
      var isClass = false;
      var isTopo = false;
      var isGltf = false;

      let main = this;
      //main._scene = scene;

      var data!: {
        [x: string]: any; X: number[], Y: number[], Z: number[], Red: number[], Green: number[], Blue: number[], GpsTime: number[], Classification: number[]}; 

      if (this.values.mode === "time"){
        isTime = true;
      }else if (this.values.mode === "classes") {
        isClass = true;
      }else if(this.values.mode == "topo"){
        isTopo = true;
      }else if(this.values.mode == "gltf"){
        isGltf = true;
      } 
      
      if (this.values.source === "cloud"){
        data = await loadPointCloud(this.values).then((results) => {return results}); 
        //if (isTime = true){sort data by GpsTime}
      }else{
        data = this.values.data;
      }
      
      const numCoords = data.X.length;
      const gltfData = this.values.gltf_data;
      const pointSize = this.values.point_size;
      const backgroundColor = this.values.background_color;
      const times = data.GpsTime;
      const offset = this.values.time_offset;
      const classification = this.values.data.Classification;
      const classes = this.values.classes;
      const topo_offset = this.values.topo_offset;
      const scale = this.zScale;
      let doClear = false;

      const xmin = data.X.reduce((accum: number, currentNumber: number) => Math.min(accum, currentNumber));
      const xmax = data.X.reduce((accum: number, currentNumber: number) => Math.max(accum, currentNumber));
      const ymin = data.Y.reduce((accum: number, currentNumber: number) => Math.min(accum, currentNumber));
      const ymax = data.Y.reduce((accum: number, currentNumber: number) => Math.max(accum, currentNumber));
      const redmax = data.Red.reduce((accum: number, currentNumber: number) => Math.max(accum, currentNumber));
      const greenmax = data.Green.reduce((accum: number, currentNumber: number) => Math.max(accum, currentNumber));
      const bluemax = data.Blue.reduce((accum: number, currentNumber: number) => Math.max(accum, currentNumber));
      const rgbMax = Math.max(redmax, greenmax, bluemax);

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
          (data.Z[i]-topo_offset) * scale,
          data.Y[i]
        );

        if (isTime) {
          particle.color = scene.clearColor;
        }
        else {
          particle.color = new Color3(
            data.Red[i]/ rgbMax,
            data.Green[i]/ rgbMax,
            data.Blue[i]/ rgbMax
          );  
        }

        /*
        // check if inside meshes
        let minDist = 999999999999;
        particle.color.set(0, .8, 0, 1);

        for (let i=0; i<main._instances.length; i++)
        {
          let mesh = (main._instances[i].getChildMeshes()[0] as Mesh);
          let bounds = main._instances[i].getHierarchyBoundingVectors(true);
          if (main.pointIsInsideMesh(mesh, bounds, particle.position))
          {
            particle.color.set(1, 0, 0, 1);
            minDist = 1;
          }
          else
          {
            // find minimum distance
            let dist = Math.max(1, particle.position.subtract(main._instances[i].position).lengthSquared() * 0.0004);
            if (dist < minDist) minDist = dist;
          }
        }

        // color based on distance
        //particle.color.r /= minDist;
        //particle.color.g /= minDist;
        //particle.color.b /= minDist;
        */
      };

      let tasks:Promise<any>[] = [];
      
      if (isGltf) {
        var blob = new Blob([gltfData]);
        var url = URL.createObjectURL(blob);
        console.log("LOADING GLTF...");

        tasks.push(SceneLoader.ImportMeshAsync("", url, "", scene, null, ".gltf").then(function(container)
        {
          console.log("MODEL IS LOADED: " + container.meshes.length + " MESHES");
          for (let i=0; i<container.meshes.length; i++) {
            let mesh = (container.meshes[i] as Mesh);
            console.log("Wireframing: " + mesh.name);
            if (mesh.material) mesh.material.wireframe = true;
          }

          for (let i=0; i<100; i++)
          {
            // create some instances
            let inst = (container.meshes[0] as Mesh).instantiateHierarchy();
            if (inst)
            {
              inst.getChildMeshes()[0].showBoundingBox = true;
              inst.position.set(-400+Math.random()*800, 0, -400+Math.random()*800);
              //main.makeDraggable((inst.getChildMeshes()[0] as Mesh), main._scene);
              main._instances.push(inst);
            }
          }

          // hide the main mesh
          for (let i=0; i<container.meshes.length; i++) {
            container.meshes[i].setEnabled(false);
          }

        }));
      }

      console.log("WAITING FOR LOAD...");
      await Promise.all(tasks);
      pcs.addPoints(numCoords, pcLoader);
      tasks.push(pcs.buildMeshAsync());

      console.log("WAITING FOR TASKS...");
      await Promise.all(tasks);
      console.log("ALL READY!");
      scene.createDefaultCameraOrLight(true, true, false);
      if (isTime || isClass) {

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
        header.height = "30px";
        header.color = "white";

        var slider = new Slider("Slider");
        slider.minimum = 0;
        slider.step = 1;
        slider.height = "20px";
        slider.width = "200px";

        if (isTime) {
          header.text = "Time: " + (offset + times[0]).toFixed(2);

          slider.maximum = times.length - 1;
          slider.value = 0;

        }
        if (isClass) {
          header.text = "All";

          var slider_classes: number[] = Array.from(new Set(classification));
          slider.maximum = slider_classes.length;
          slider.value = slider_classes[0];
        }

        panel.addControl(header);

        pcs.updateParticle = function (particle_3: any) {
          if (doClear)
            particle_3.color = scene.clearColor;

          else
            particle_3.color = new Color3(
              data.Red[particle_3.idx]/ rgbMax,
              data.Green[particle_3.idx]/ rgbMax,
              data.Blue[particle_3.idx]/ rgbMax
            );

          return particle_3;
        };

        slider.onValueChangedObservable.add(
          function (value: any) {
            if (isTime) {
              header.text = "Time: " + (offset + times[value]).toFixed(2);

              if (value > pcs.counter) {
                doClear = false;
                pcs.setParticles(pcs.counter, value);
              } else {
                doClear = true;
                pcs.setParticles(value, pcs.counter);
              }
              pcs.counter = value;
            }
            if (isClass) {
              var v: number = classes.numbers.indexOf(slider_classes[value]);
              header.text = classes.names[v];

              var start_1: number = classification.indexOf(slider_classes[value]);
              var finish: number = classification.lastIndexOf(slider_classes[value]);

              doClear = true;
              pcs.setParticles(0, numCoords);

              doClear = false;
              pcs.setParticles(start_1, finish);
            }
          });

        panel.addControl(slider);
      }
      if (isTopo) {

        const mapbox_img = this.values.mapbox_img;
        var blob_1 = new Blob([mapbox_img]);
        var url_1 = URL.createObjectURL(blob_1);

        const mat = new StandardMaterial("mat", scene);
        mat.emissiveColor = Color3.Random();
        mat.diffuseTexture = new Texture(url_1, scene);
        mat.ambientTexture = new Texture(url_1, scene);

        const options = { xmin: xmin, zmin: ymin, xmax: xmax, zmax: ymax };
        const ground = MeshBuilder.CreateTiledGround("tiled ground", options, scene);
        ground.material = mat;

      }
      
      scene.clearColor = new Color4(backgroundColor[0], backgroundColor[1], backgroundColor[2],backgroundColor[3]);
      
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
      camera.setTarget(new Vector3((xmin + xmax) / 2, 0, (ymin + ymax) / 2));
      camera.attachControl(this.canvas, false);
      return scene;
    });
  }

  runImportPoints(): Promise<boolean>
  {
    return new Promise(
      function (resolve, reject) {
        resolve(true);
      }
    );
  }

  makeDraggable(mesh: Mesh, scene: Scene): void
  {
    let boundingBox = BoundingBoxGizmo.MakeNotPickableAndWrapInBoundingBox(mesh);

    // Create bounding box gizmo
    let utilLayer = new UtilityLayerRenderer(scene);
    utilLayer.utilityLayerScene.autoClearDepthAndStencil = false;
    let gizmo = new BoundingBoxGizmo(Color3.FromHexString("#0984e3"), utilLayer);
    gizmo.attachedMesh = boundingBox;

    // Create behaviors to drag and scale with pointers in VR
    let sixDofDragBehavior = new SixDofDragBehavior();
    boundingBox.addBehavior(sixDofDragBehavior);
    let multiPointerScaleBehavior = new MultiPointerScaleBehavior();
    boundingBox.addBehavior(multiPointerScaleBehavior);
  }

  pointIsInsideMesh(mesh: Mesh, boundInfo:{min:Vector3, max:Vector3}, point: Vector3): boolean
  {
    let max = boundInfo.max.add(mesh.position);
    let min = boundInfo.min.add(mesh.position);
    let diameter = max.subtract(min).length() * 2;

    if (point.x < min.x || point.x > max.x) {
      return false;
    }

    if (point.y < min.y || point.y > max.y) {
      return false;
    }

    if (point.z < min.z || point.z > max.z) {
      return false;
    }

    const directions:Vector3[] =
    [
      new Vector3(0, 1, 0),
      //new Vector3(0, -1, 0),
      new Vector3(-.89, 0.45, 0),
      new Vector3(.89, 0.45, 0),
    ]

    let ray = new Ray(point, Axis.X, diameter);

    for (let c=0; c<directions.length; c++)
    {
      ray.direction = directions[c];
      if (!ray.intersectsMesh(mesh).hit) return false;
    }

    return true;
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
      const xy_length = Math.min(Math.max(maxx)-Math.min(minx),Math.max(maxy)-Math.min(miny))
      const scale = this.zScale;

      // set up camera
      scene.createDefaultCameraOrLight(true, true, true)
      let camera = scene.activeCamera as ArcRotateCamera;
      camera.alpha += Math.PI;
      camera.upperBetaLimit = Math.PI / 2;
      camera.panningAxis = new Vector3(1, 1, 0);
      camera.panningSensibility = 0.9;
      camera.panningInertia = 0.2;
      camera._panningMouseButton = 0;

      if (this.wheelPrecision > 0)
        camera.wheelPrecision = this.wheelPrecision;

      camera.setTarget(new Vector3((((maxx+minx)/2) - minx) / xy_length, 0, (((maxy+miny)/2) - miny) / xy_length));
      camera.attachControl(this.canvas, false);

      var mat = new StandardMaterial('mt1', scene);
      mat.alpha = 0.85;
      mat.diffuseColor = new Color3(0, 0, 0);
      mat.emissiveColor = new Color3(0.5, 0.5, 0.5);

      // create initial particles
      const SPS = new SolidParticleSystem("SPS", scene, {enableDepthSort: true});
      const box = MeshBuilder.CreateBox("b", {height: 1, width: 1, depth: 1});
      SPS.addShape(box, data.Xmin.length);
      var mesh = SPS.buildMesh();
      mesh.material = mat;
      box.dispose(); 
      
      // add dimensions and a random color to each of the particles
      SPS.initParticles = () => {
        for (let p = 0; p < SPS.nbParticles; p++) {
          const particle = SPS.particles[p];
          particle.position.x = (((data.Xmax[p]+data.Xmin[p])/2) - minx) / xy_length;
          particle.position.y = ((((data.Zmax[p]+data.Zmin[p])/2) - minz) / xy_length ) * scale;  
          particle.position.z = (((data.Ymax[p]+data.Ymin[p])/2) - miny) / xy_length;
          particle.scaling.x = (data.Xmax[p]-data.Xmin[p]) / xy_length;
          particle.scaling.y = ((data.Zmax[p]-data.Zmin[p]) / xy_length) * scale;  
          particle.scaling.z = (data.Ymax[p]-data.Ymin[p]) / xy_length;
          particle.color = new Color4(0.5 + Math.random() * 0.6, 0.5 + Math.random() * 0.6, 0.5 + Math.random() * 0.6,0.9);   
        }
      };

      // update SPS mesh
      SPS.initParticles();
      SPS.setParticles();

      // animation
      scene.registerBeforeRender(function() {
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
      _view_module_version: BabylonImageModel.view_module_version,
    };
  }

  static model_name = 'BabylonImageModel';
  static view_name = 'BabylonImageView';
}

export class BabylonImageView extends BabylonBaseView {

  protected async createScene(): Promise<Scene> {
    return super.createScene().then( ( scene ) => {
      const data = this.values.data;
      const bbox = this.values.xy_bbox;

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

      const xmin = bbox[0];
      const xmax = bbox[1];
      const ymin = bbox[2];
      const ymax = bbox[3];

      const ground = MeshBuilder.CreateGround("ground", {height: (xmax-xmin)*0.005, width: (ymax-ymin)*0.005, subdivisions: 36}, scene);
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
      camera.attachControl(this.canvas, false);

      return scene;
    });
  }
}

async function loadPointCloud(values: {name_space: string, array_name: string, bbox: { X: number[], Y: number[], Z: number[]}, token: string}) {

  const config = {
    apiKey: values.token
  };

  const tiledbClient = new Client(config);

  const query: { layout: any, ranges: number[][], bufferSize: number, attributes: any} = {
    layout: Layout.Unordered,
    ranges: [values.bbox.X, values.bbox.Y, values.bbox.Z],
    bufferSize: 150000000000,
    attributes: ['X','Y','Z','Red','Green','Blue','GpsTime','Classification']
  };

  for await (let results of tiledbClient.query.ReadQuery(
    values.name_space,
    values.array_name,
    query
  )) {
    return results
  }
  
};  