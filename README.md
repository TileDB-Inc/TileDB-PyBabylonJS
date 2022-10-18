
# TileDB-PyBabylonJS

[![codecov](https://codecov.io/gh/TileDB-Inc/PyBabylonJS/branch/master/graph/badge.svg)](https://codecov.io/gh/TileDB-Inc/PyBabylonJS)
[![Build Status](https://dev.azure.com/TileDB-Inc/CI/_apis/build/status/TileDB-Inc.TileDB-PyBabylonJS?branchName=main)](https://dev.azure.com/TileDB-Inc/CI/_build/latest?definitionId=37&branchName=main)


The TileDB-PyBabylonJS library is a geospatial data visualization Python library that interactively visualizes TileDB arrays with [Babylon.js](https://www.babylonjs.com) in a Jupyter notebook widget.

The package is under development and currently contains:

* point cloud visualizations with the option to stream all data from a TileDB array or define a bounding box to load a slice of the array
* MBRS visualization showing the minimum bounding rectangles of the [fragments](https://docs.tiledb.com/main/background/key-concepts-and-data-format#fragments) in the sparse array containing point cloud data

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
conda install -c conda-forge mamba

mamba create -n pybabylonjs-dev -c conda-forge nodejs yarn python=3.7.10 tree scipy 'pyarrow>2' numpy pandas tiledb-py rasterio gdal pdal python-pdal jupyter-packaging jupyterlab

conda activate pybabylonjs-dev

pip install opencv-python
```

Fork or clone the repo and go to the main directory. Install the TileDB-PyBabylonJS Python package that will also build the TypeScript package:

```bash
pip install -e ".[test, examples]"
```

When developing your extensions you need to manually enable your extensions with the notebook / lab frontend. For jupyter lab this is done by the command:

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

### Point clouds

Jupyter notebooks are provided in the [examples folder](https://github.com/TileDB-Inc/TileDB-PyBabylonJS/tree/main/examples) for the following visualizations:

* [Slice of the Autzen point cloud](/examples/autzen_slice.ipynb)
* [Streaming the Autzen point cloud](/examples/autzen-streaming.ipynb)
* [Slice of the Boulder point cloud](/examples/point-cloud-boulder.ipynb)

Display a point cloud visualization from a TileDB cloud sparse array by specifying the bounding box of a slice of the data:

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
                 token = "***",
                 bbox = bbox,
                 particle_size = 2.5,
                 width = 1000,
                 height = 900,
                 rgb_max = 65535,
                 camera_radius = 700)
```

Or stream all data from a group of arrays:

```python
show.point_cloud(streaming=True,
                 uri="***",
                 token="***",
                 max_levels=6,
                 particle_size = 3,
                 color_scheme = 'light',
                 width = '1200px',
                 height = '800px',
                 rgb_max = 255,
                 camera_radius = 800,
                 particle_budget = 8000000)
```

