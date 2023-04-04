
# TileDB-PyBabylonJS

[![codecov](https://codecov.io/gh/TileDB-Inc/PyBabylonJS/branch/master/graph/badge.svg)](https://codecov.io/gh/TileDB-Inc/PyBabylonJS)
[![Build Status](https://dev.azure.com/TileDB-Inc/CI/_apis/build/status/TileDB-Inc.TileDB-PyBabylonJS?branchName=main)](https://dev.azure.com/TileDB-Inc/CI/_build/latest?definitionId=37&branchName=main)


The TileDB-PyBabylonJS library is a geospatial data visualization Python library that interactively visualizes TileDB arrays with [Babylon.js](https://www.babylonjs.com) in a Jupyter notebook widget.

The package is under development and currently contains point cloud visualizations with the option to stream all data from a TileDB array or define a bounding box to load a slice of the array

## Installation

This project is available from [PyPI](https://pypi.org/project/pybabylonjs/) and can be installed with `pip`:

```bash
pip install pybabylonjs
```

If you are using Jupyter Notebook 5.2 or earlier, you may also need to enable the nbextension:
```bash
jupyter nbextension enable --py [--sys-prefix|--user|--system] pybabylonjs
```

## Development Installation

Create and activate a development environment:

```bash
conda create -n pybabylonjs-dev -c conda-forge nodejs yarn python tree scipy 'pyarrow>2' numpy pandas tiledb-py jupyter-packaging jupyterlab

conda activate pybabylonjs-dev

pip install opencv-python
```

Fork or clone the repo and go to the main directory. Install the TileDB-PyBabylonJS Python package that will also build the TypeScript package:

```bash
pip install -e ".[test, examples]"
```

When developing extensions you need to manually enable the extensions with the notebook / lab frontend. For jupyter lab this is done by the command:

```bash
jupyter labextension install @jupyter-widgets/jupyterlab-manager
yarn run build
jupyter labextension install .
```

For a classic notebook you need to run:

```bash
jupyter nbextension install --sys-prefix --symlink --overwrite --py pybabylonjs
jupyter nbextension enable --sys-prefix --py pybabylonjs
```

Note that the `--symlink` flag doesn't work on Windows, so you will here have to run
the `install` command every time that you rebuild your extension. For certain installations
you might also need another flag instead of `--sys-prefix`.

### How to see your changes

#### TypeScript

The TypeScript code for the visualizations can be found in the [TileDB-Viz](https://github.com/TileDB-Inc/TileDB-Viz) repository. After making changes in TileDB-Viz build the package with:

`yarn build`

To then see these changes in TileDB-PyBabylonJS run:

`yarn add file:/path/to/TileDB-Viz/packages/core`

`yarn build`

And restart the notebook kernel. 

#### Python

When you make a change to the Python code rebuild the package and restart the notebook kernel to see your changes.

## Usage

Jupyter notebooks are provided in the [examples folder](https://github.com/TileDB-Inc/TileDB-PyBabylonJS/tree/main/examples) for the following visualizations:

* [Point cloud visualization parameters](examples/point-cloud-parameters.ipynb) contains a description of all parameters
* [Slice of the Autzen point cloud](examples/autzen-slice.ipynb)
* [Slice of the Boulder point cloud](examples/boulder-slice.ipynb)
* [Streaming the Autzen point cloud](examples/autzen-streaming.ipynb)
* [Streaming the Bristol point cloud](examples/bristol-streaming.ipynb)
* [Streaming the Santorini point cloud](examples/santorini-streaming.ipynb) 

[Sign up for a TileDB account](https://cloud.tiledb.com/auth/signup) and display a point cloud visualization from a TileDB cloud sparse array by specifying the bounding box of a slice of data:

```python
from pybabylonjs import Show as show

bbox = {
    'X': [636800, 637200],
    'Y': [852800, 853100],
    'Z': [406.14, 615.26]
}

lidar_array = "autzen-classified"

show.point_cloud(source="cloud",
                 uri = "tiledb://TileDB-Inc/autzen_classified_tiledb",
                 token=token,
                 bbox = bbox,
                 point_size = 3,
                 rgb_max = 65535,
                 camera_up = 25,
                 camera_location = 2,
                 camera_zoom = [2,2,2],
                 point_type = 'fixed_screen_size',
                 width=1000,
                 height=600)
```

Or stream all data from a group of arrays: 

```python
show.point_cloud(streaming=True,
                 uri="tiledb://TileDB-Inc/bristol",
                 token=token, 
                 point_size = 4,
                 wheel_precision = 0.2,
                 color_scheme = 'dark',
                 width = 1200,
                 height = 800,             
                 rgb_max = 255,
                 point_budget = 3500000,
                 camera_location = 8,
                 camera_zoom = [1, 1, 2],
                 camera_up = 50, 
                 move_speed = 8,
                 point_type = 'fixed_world_size')
```

### Parameters

The following parameters can be set for a point cloud visualization:

* `camera_location` is the location of the arcRotateCamera in relation to the centre of the point cloud. 1: south, 2: south-east, 3: east, 4: north-east, 5: north, 6: north-west, 7: west, 8: south-west and 9: looking down from above the centre of the point cloud
* `camera_up` is the height of the initial location of the freeCamera
* `camera_zoom` scales the camera position relative to the centre of the point cloud with `[1,1,1]` being in the default position and `[2,2,2]` is then twice a far away from the centre in the X, Y and Z direction
* `color_scheme` is the initial background color: `dark` (default), `light` or ` blue`
* `data` is the dictionary with the point cloud data when `source = dict`. This dictionary needs to contain values for the location `X`, `Y` and `Z` and the RGB color for each point `Red`, `Green` and `Blue`
* `height` is the height of the display window in pixels
* `point_size` is the size of the points
* `point_type` is the interactive point size type
  * `fixed_screen_size` (default): each point has a constant size in pixels regardless of its distance to the camera
  * `fixed_world_space`: each point has a constant size in world space. This value should be set accordingly to the spacing of the points in world space
  * `adaptive_world_space`: the same as `fixed_world_space` for the below example. But when streaming point cloud data, the point size depends on the locally loaded LODs at each point. The point density across all blocks of the same LOD should be the same and the point density should double at each LOD
* `source` is the data source (`cloud` (default), `local` or `dict`)
* `use_sps=True` displays the points as 3D blocks using a [Solid Particle System](https://doc.babylonjs.com/features/featuresDeepDive/particles/solid_particle_system/sps_intro)
* `use_shader=True` adds the EDL shading 
* `edl_strength` is the strenght of the shader
* `wheel_precision` gives control over how fast to zoom with the mouse wheel
* `width` is the width of the display window in pixels

### Navigating the point cloud

There are two different cameras available to navigate the point cloud, the arcRotateCamera and freeCamera. Toggle between them with `c`. The initial camera is always the arcRotateCamera

**arcRotateCamera** 
* Zoom in and out with the scroll wheel
* Rotate by dragging the mouse with left button down
* The parameter `wheel_precision` gives control over how fast to zoom with the mouse wheel
* The camera location and distance from the centre of the points can be changed with `camera_location` and `camera_zoom`
* Rotate through the `camera_locations` with `v`
* Change the background color between dark and light with `b`

**freeCamera**
* Move forward: `w` or `up`
* Move backward: `s` or `down`
* Move up: `e`
* Move down: `q`
* Move to the left: `a` or `left`
* Move to the right: `d` or `right`
* Rotate by dragging the mouse with left button down
* The initial camera position is the centre of the point cloud, the height of the location can be changed with the parameter `camera_up`
* The camera speed can be changed with the parameter `move_speed`
* Change the background color between dark and light with `b`