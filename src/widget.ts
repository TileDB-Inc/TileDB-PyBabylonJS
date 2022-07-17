// Copyright 2022 TileDB Inc.
// Licensed under the MIT License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';
import { ArcRotateCamera, Color3, Color4, Engine, PointsCloudSystem, Scene, SceneLoader, 
  StandardMaterial, SolidParticleSystem, MeshBuilder,
  Vector3, Texture, Axis, Camera, int, Mesh, Ray, UtilityLayerRenderer, FreeCamera, KeyboardEventTypes, PointerEventTypes } from '@babylonjs/core';
import {AdvancedDynamicTexture, Control, StackPanel, Slider, TextBlock} from 'babylonjs-gui';
import "@babylonjs/loaders/glTF";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import '../css/widget.css';

import { setPointCloudSwitches, getPointCloud } from "./data";
import { DragGizmos } from './drag_gizmos';

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
  private _scene!: Scene;
  private _util_layer!: UtilityLayerRenderer;
  private _moved_after_click = false;
  private _shift_pressed = false;
  private _selected: Array<Mesh> = new Array<Mesh>();
  private _axes: Array<DragGizmos> = new Array<DragGizmos>();
  private _cameras: Array<Camera> = new Array<Camera>();
  private _curr_camera: int = 0;
  
  protected async createScene(): Promise<Scene> {
    return super.createScene().then(async scene => {

      const main = this;
      main._scene = scene;

      // add button for fullscreen switching
      var fullDiv = document.createElement("div");
      fullDiv.style.cssText = "position:absolute; bottom:32px; right:32px; color:#FFFF00";
      let fullButton = document.createElement('button');
      fullButton.onclick = function () { main.canvas!.requestFullscreen(); };
      fullButton.innerText = '[ ]';
      fullButton.className = 'button';
      fullDiv.appendChild(fullButton);
      document.body.appendChild(fullDiv);

      const {isTime, isClass, isTopo, isGltf} = setPointCloudSwitches(this.values.mode);

      var {data, xmin, xmax, ymin, ymax, zmin, zmax, rgbMax}  = await getPointCloud(this.values).then((results) => {return results});

      const size_x = xmax - xmin;
      const size_y = ymax - ymin;
      const size_z = zmax - zmin;
      const center_x = xmin + size_x / 2;
      const center_y = ymin + size_y / 2;
      const center_z = zmin + size_z / 2;

      const numCoords = data.X.length;
      const times = data.GpsTime;
      const classification = data.Classification; 
      
      const gltfData = this.values.gltf_data;
      const pointSize = this.values.point_size;
      const backgroundColor = this.values.background_color;
      const offset = this.values.time_offset;
      const classes = this.values.classes;
      const topo_offset = this.values.topo_offset;
      const scale = this.zScale;

      let doClear = false;
      
      scene.clearColor = new Color4(backgroundColor[0], backgroundColor[1], backgroundColor[2],backgroundColor[3]);
      
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

        if (main.values.distance_colors) {
          // check if inside meshes
          let minDist = 999999999999;
          particle.color.set(0, 1, 0, 1);
  
          for (let i=0; i<scene.meshes.length; i++)
          {
            let mesh = (scene.meshes[i] as Mesh);
            let bounds = scene.meshes[i].getHierarchyBoundingVectors(true);
            if (main.pointIsInsideMesh(mesh, bounds, particle.position))
            {
              particle.color.set(1, 0, 0, 1);
              minDist = 1;
            }
            else
            {
              // find minimum distance
              let dist = Math.max(1, particle.position.subtract(scene.meshes[i].position).lengthSquared() * 0.0004);
              if (dist < minDist) minDist = dist;
            }
          }

          // color based on distance
          //particle.color.r /= minDist;
          //particle.color.g /= minDist;
          //particle.color.b /= minDist;
        }
      };

      const tasks:Promise<any>[] = [];


      if (isGltf) {

        if (this.values.gltf_multi===false){
          var blob = new Blob([gltfData]);
          var url = URL.createObjectURL(blob);
    
          tasks.push(SceneLoader.ImportMeshAsync('', url, '', scene, null, '.gltf').then(
            container => {
    
            container.meshes[0].rotation = new Vector3(
              this.values.mesh_rotation[0],
              this.values.mesh_rotation[1],
              this.values.mesh_rotation[2]);
            container.meshes[0].scaling = new Vector3(
              this.values.mesh_scale[0],
              this.values.mesh_scale[1],
              this.values.mesh_scale[2]);
            container.meshes[0].position.x = container.meshes[0].position.x + this.values.mesh_shift[0];
            container.meshes[0].position.y = container.meshes[0].position.y + this.values.mesh_shift[1];
            container.meshes[0].position.z = container.meshes[0].position.z + this.values.mesh_shift[2];
            }
          ));
        }
        else if (this.values.gltf_multi===true) {
          for (let i=0; i<gltfData.length; i++){
            var blob = new Blob([gltfData[i]]);
            var url = URL.createObjectURL(blob);
        
            tasks.push(SceneLoader.ImportMeshAsync('', url, '', scene, null, '.gltf').then(
              container => {
        
                container.meshes[0].rotation = new Vector3(
                  this.values.mesh_rotation[0],
                  this.values.mesh_rotation[1],
                  this.values.mesh_rotation[2]);
                container.meshes[0].scaling = new Vector3(
                  this.values.mesh_scale[0],
                  this.values.mesh_scale[1],
                  this.values.mesh_scale[2]);
                container.meshes[0].position.x = container.meshes[0].position.x + this.values.mesh_shift[0];
                container.meshes[0].position.y = container.meshes[0].position.y + this.values.mesh_shift[1];
                container.meshes[0].position.z = container.meshes[0].position.z + this.values.mesh_shift[2];
              }
            ));
          }
        }

      }

      // needed to force then synchronous
      // because we needed the model loaded
      // for clash detection on pointcloud load.
      await Promise.all(tasks);
      pcs.addPoints(numCoords, pcLoader);
      tasks.push(pcs.buildMeshAsync());
      await Promise.all(tasks);

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

      // create gizmos utility
      main._util_layer = new UtilityLayerRenderer(scene);

      // handle mouse clicks to select/deselect meshes
      scene.onPointerObservable.add(pointerInfo => {
        switch (pointerInfo.type) {
          case PointerEventTypes.POINTERDOWN:
            main._moved_after_click = false;
            break;
          case PointerEventTypes.POINTERUP:
            if (!main._moved_after_click) {
              main.pickMesh();
            }
            break;
          case PointerEventTypes.POINTERMOVE:
            main._moved_after_click = true;
            break;
          case PointerEventTypes.POINTERWHEEL:
            break;
          case PointerEventTypes.POINTERPICK:
            break;
          case PointerEventTypes.POINTERTAP:
            break;
          case PointerEventTypes.POINTERDOUBLETAP:
            break;
        }
      });

      // handle key presses
      scene.onKeyboardObservable.add(kbInfo => {
        switch (kbInfo.type) {
          case KeyboardEventTypes.KEYDOWN:
            // toggle current camera
            if (kbInfo.event.key === 'c') {
              main._cameras[main._curr_camera].detachControl();
              main._curr_camera = (main._curr_camera + 1) % main._cameras.length;
              main._cameras[main._curr_camera].attachControl(true);
              const cam_name = main._cameras[main._curr_camera].name;
              main._scene.setActiveCameraByName(cam_name);
              console.log('Current camera: [' + main._curr_camera + '] ' + cam_name);
              console.log(main._cameras[main._curr_camera].position);
              console.log(main._cameras[main._curr_camera].minZ + " .. " + main._cameras[main._curr_camera].maxZ);
            }
            
            // perform clash detection
            if (kbInfo.event.key === '=') {
              this.values.distance_colors = true;
              pcs = new PointsCloudSystem('pcs', pointSize, scene, {
                updatable: isClass || isTime
              });
              pcs.addPoints(numCoords, pcLoader);
              pcs.buildMeshAsync();
            }

            // perform clash detection
            if (kbInfo.event.key === '-') {
              this.values.distance_colors = false;
              pcs = new PointsCloudSystem('pcs', pointSize, scene, {
                updatable: isClass || isTime
              });
              pcs.addPoints(numCoords, pcLoader);
              pcs.buildMeshAsync();
            }

            // toggle selected objects wireframe
            if (kbInfo.event.key === 'r') {
              main.toggleSelectedWireframe();
            }

            // focus on selected objects
            if (kbInfo.event.key === 'f') {
              main.focusSelected();
            }

            // show info about selected objects
            if (kbInfo.event.key === 'i') {
              main.infoSelected();
            }

            if (kbInfo.event.key === 'Shift') {
              // shift
              main._shift_pressed = true;
            }

            break;
          case KeyboardEventTypes.KEYUP:
            if (kbInfo.event.key === 'Shift') {
              // shift
              main._shift_pressed = false;
            }
            break;
        }
      });

      scene.createDefaultCameraOrLight(true, true, true);

      const camera = scene.activeCamera as ArcRotateCamera;
      camera.alpha += Math.PI;
      camera.upperBetaLimit = Math.PI / 2;
      //camera.panningAxis = new Vector3(1, 1, 0);
      //camera.panningSensibility = 0.9;
      //camera.panningInertia = 0.2;
      //camera._panningMouseButton = 0;

      if (this.wheelPrecision > 0)
        camera.wheelPrecision = this.wheelPrecision;

      camera.setTarget(new Vector3(center_x, center_z, center_y));
      this._cameras.push(camera);

      const camera2 = new FreeCamera('free', new Vector3(center_x, center_z, center_y), scene);
      camera2.minZ = camera.minZ;
      camera2.maxZ = camera.maxZ;
      if (this.moveSpeed > 0) {
        camera2.speed = this.moveSpeed;
      } else {
        camera2.speed = 0.5;
      }
      camera2.keysUp.push(87); // W
      camera2.keysDown.push(83); // D
      camera2.keysLeft.push(65); // A
      camera2.keysRight.push(68); // S
      camera2.keysUpward.push(69); // E
      camera2.keysDownward.push(81); // Q
      this._cameras.push(camera2);

      return scene;
    });
  }


  // --------------------
  // Extras
  // --------------------


  // Add dragging axes to mesh
  addAxes(mesh: Mesh): DragGizmos {
    const gizmo = new DragGizmos(mesh, this._util_layer);
    return gizmo;
  }

  // Select a mesh
  select(mesh: Mesh, toggle: boolean): void {
    if (this._selected.includes(mesh)) {
      if (toggle) {
        this.unselect(mesh);
      }
      return;
    }

    this._selected.push(mesh);
    this._axes.push(this.addAxes(mesh));
  }

  // Unselect a mesh
  unselect(mesh: Mesh): void {
    const index = this._selected.findIndex(e => e === mesh);
    if (index == undefined) {
      return;
    }

    this._axes[index].dispose();
    this._axes.splice(index, 1);
    this._selected.splice(index, 1);
  }

  // Unselect all meshes
  unselectAll(): void {
    for (let i = 0; i < this._selected.length; i++) {
      this._axes[i].dispose();
    }

    this._selected = [];
    this._axes = [];
  }

  // Toggle wireframe on mesh
  toggleMeshWireframe(mesh: Mesh) {
    if (mesh.material) {
      mesh.material.wireframe = !mesh.material.wireframe;
    }

    const children = mesh.getChildMeshes();
    for (let c = 0; c < children.length; c++) {
      this.toggleMeshWireframe(children[c] as Mesh);
    }
  }

  // Toggle wireframe on selected meshes
  toggleSelectedWireframe(): void {
    for (let s = 0; s < this._selected.length; s++) {
      const mesh = this._selected[s] as Mesh;
      this.toggleMeshWireframe(mesh);
    }
  }

  // Focus camera into selected mesh
  focusSelected(): void {
    if (this._selected.length === 0) {
      return;
    }
    const center = new Vector3(0, 0, 0);
    for (let s = 0; s < this._selected.length; s++) {
      center.addInPlace(this._selected[s].position);
    }
    center.scaleInPlace(this._selected.length);
    (this._cameras[this._curr_camera] as ArcRotateCamera).setTarget(center);
  }

  // Show info about selected mesh -- just position for now
  infoSelected(): void {
    if (this._selected.length === 0) {
      return;
    }
    for (let s = 0; s < this._selected.length; s++) {
      console.log(this._selected[s].name + ': ' + this._selected[s].position);
    }
  }

  // Pick a mesh
  pickMesh(): void {
    const pick = this._scene.pick(this._scene.pointerX, this._scene.pointerY);
    if (!pick || !pick.ray) {
      return;
    }

    const ray = new Ray(pick.ray.origin, pick.ray.direction, 100000);
    const hit = this._scene.pickWithRay(ray);

    if (hit && hit.pickedMesh) {
      let sel = hit.pickedMesh;
      while (sel.parent) {
        sel = sel.parent as Mesh;
      }
      if (!this._shift_pressed) {
        this.unselectAll();
      }
      this.select(sel as Mesh, true);
    } else {
      this.unselectAll();
    }
  }

  pointIsInsideMesh(
    mesh: Mesh,
    boundInfo: { min: Vector3; max: Vector3 },
    point: Vector3
  ): boolean {
    const max = boundInfo.max.add(mesh.position);
    const min = boundInfo.min.add(mesh.position);
    const diameter = max.subtract(min).length() * 2;

    if (point.x < min.x || point.x > max.x) {
      return false;
    }

    if (point.y < min.y || point.y > max.y) {
      return false;
    }

    if (point.z < min.z || point.z > max.z) {
      return false;
    }

    const directions: Vector3[] = [
      new Vector3(0, 1, 0),
      //new Vector3(0, -1, 0),
      new Vector3(-0.89, 0.45, 0),
      new Vector3(0.89, 0.45, 0)
    ];

    const ray = new Ray(point, Axis.X, diameter);

    for (let c = 0; c < directions.length; c++) {
      ray.direction = directions[c];
      if (!ray.intersectsMesh(mesh).hit) {
        return false;
      }
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




