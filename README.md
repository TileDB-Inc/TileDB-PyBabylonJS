
# TileDB-PyBabylonJS

[![codecov](https://codecov.io/gh/TileDB-Inc/PyBabylonJS/branch/master/graph/badge.svg)](https://codecov.io/gh/TileDB-Inc/PyBabylonJS)
[![Build Status](https://dev.azure.com/TileDB-Inc/CI/_apis/build/status/TileDB-Inc.TileDB-PyBabylonJS?branchName=main)](https://dev.azure.com/TileDB-Inc/CI/_build/latest?definitionId=37&branchName=main)


The TileDB-PyBabylonJS library is a geospatial data visualization Python library that interactively visualizes TileDB arrays with [Babylon.js](https://www.babylonjs.com) in a Jupyter notebook widget. 

## Installation

This project is available from [PyPI](https://pypi.org/project/pybabylonjs/) and can be installed with `pip`:
You can install using `pip`:`

```bash
pip install pybabylonjs
```

If you are using Jupyter Notebook 5.2 or earlier, you may also need to enable
the nbextension:
```bash
jupyter nbextension enable --py [--sys-prefix|--user|--system] pybabylonjs
```

## Development Installation

Create a dev environment:
```bash
conda create -n pybabylonjs-dev -c conda-forge nodejs yarn python jupyterlab
conda activate pybabylonjs-dev
```

Fork or clone the repo. Install the Python package. This will also build the TS package.
```bash
pip install -e ".[test, examples]"
```

When developing your extensions, you need to manually enable your extensions with the
notebook / lab frontend. For jupyter lab, this is done by the command:

```
jupyter labextension install @jupyter-widgets/jupyterlab-manager
yarn run build
jupyter labextension install .
```

For a classic notebook, you need to run:

```
jupyter nbextension install --sys-prefix --symlink --overwrite --py pybabylonjs
jupyter nbextension enable --sys-prefix --py pybabylonjs
```

Note that the `--symlink` flag doesn't work on Windows, so you will here have to run
the `install` command every time that you rebuild your extension. For certain installations
you might also need another flag instead of `--sys-prefix`, but we won't cover the meaning
of those flags here.

### How to see your changes
#### Typescript:
If you use JupyterLab to develop then you can watch the source directory and run JupyterLab at the same time in different
terminals to watch for changes in the extension's source and automatically rebuild the widget.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
yarn run watch
# Run JupyterLab in another terminal
jupyter lab
```

After a change wait for the build to finish and then refresh your browser and the changes should take effect.

#### Python:
If you make a change to the python code then you will need to restart the notebook kernel to have it take effect.

## Usage

Currently two data visualizations are supported for LiDAR point clouds:

* 3D point cloud visualization
* 3D MBRS visualization

Full examples can be found it the example notebooks [here]](https://github.com/TileDB-Inc/TileDB-PyBabylonJS/tree/main/examples).

### 3D point cloud visualization

To create this visualization load a slice of the data and create a dictionary with the coordinates of the points and the RGB values:

```python
from pybabylonjs import Show as show

with tiledb.open("autzen1") as arr:
    df = pd.DataFrame(arr[636800:637800, 851000:853000, 406.14:615.26])

data = {
    'X': df['X'],
    'Y': df['Y'],
    'Z': df['Z'],
    'Red': df['Red'] / 255.0,
    'Green': df['Green'] / 255.0,
    'Blue': df['Blue'] / 255.0
}
```

Visualize the 3D point cloud with `pybabylonjs.Show.from_dict()` by specifying `data` and the `style` to use. Optional parameters are the `width` and `height` of the frame, the scaling factor `z_scale` of the z-axis and the wheel precision `wheel_precision`:

```python
show.from_dict(data=data,
                style = 'pointcloud',
                width = 800,
                height = 600)
```

This creates an interactive visualization in a notebook widget of which the below is a screenshot:

<img src="examples/pointcloud.png"  width="400" height="300" />

To add a slider over time sort the data by `GpsTime` and add the parameter `time=True`:

```python
with tiledb.open("autzen") as arr:
    df = pd.DataFrame(arr[636800:637800, 851000:853000, 406.14:615.26])
    
df.sort_values(by=["GpsTime"], inplace=True)

data = {
    'X': df['X'],
    'Y': df['Y'],
    'Z': df['Z'],
    'Red': df['Red'] / 255.0,
    'Green': df['Green'] / 255.0,
    'Blue': df['Blue'] / 255.0,
    'GpsTime': df['GpsTime']}

show.from_dict(data=data, style="pointcloud", time=True)
```    

### 3D MBRS visualization

This visualization is created directly from a sparse array by specifying the `array_uri`, the style as `mbrs` and optional `height` and `width` parameters:

```python
show.from_array(array_uri='autzen',
                style='mbrs',
                width=800,
                height=600,
                z_scale = 0.5)
```

This creates an interactive visualization in a notebook widget of which the below is a screenshot:

<img src="examples/mbrs.png"  width="400" height="300" />