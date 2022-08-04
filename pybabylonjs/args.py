# Copyright 2022 TileDB Inc.
# Licensed under the MIT License.
"""Functions to format and check the data and keyword arguments for each data source and visualization mode."""

import os
from urllib.parse import urlparse

from .data import *

POINT_CLOUD_ARGS_DEFAULTS = {
    "inspector": False,
    "width": 800,
    "height": 600,
    "z_scale": 1,
    "wheel_precision": -1,
    "move_speed": -1,
    "point_size": 1,
    "color_scheme": "dark",
    "bbox": None,
    "rgb_max": None,
    "time_offset": 0,
    "classes": {"numbers": [], "names": []},
    "mbtoken": None,
    "mbstyle": "streets-v11",
    "crs": "EPSG:2994",
    "topo_offset": 0,
    "gltf_data": None,
    "gltf_multi": False,
    "name_space": None,
    "array_name": None,
    "token": None,
    "tiledb_env": None,
    "show_fraction": None,
    "point_shift": [None, None, None],
    "mesh_shift": [0, 0, 0],
    "mesh_rotation": [0, 0, 0],
    "mesh_scale": [1, 1, 1],
    "distance_colors": False,
}


def check_point_cloud_args(mode, point_cloud_args_in):

    if mode == "classes":
        if not "classes" in point_cloud_args_in:
            raise ValueError(
                "The classes containing numbers and names is not specified"
            )
    elif mode == "topo":
        if not "mbtoken" in point_cloud_args_in:
            raise ValueError("The Mapbox token is not specified")
        if not "crs" in point_cloud_args_in:
            raise ValueError(
                "The crs (coordinate reference system) of the data is not specified"
            )
        if not "bbox" in point_cloud_args_in:
            raise ValueError("The bbox is not specified")
    elif mode == "gltf":
        if not "gltf_data" in point_cloud_args_in:
            raise ValueError("gltf_data is not specified")

    point_cloud_args = dict(POINT_CLOUD_ARGS_DEFAULTS)
    for key in POINT_CLOUD_ARGS_DEFAULTS.keys():
        if key in point_cloud_args_in:
            point_cloud_args[key] = point_cloud_args_in.pop(key)

    return point_cloud_args


def check_point_cloud_data_dict(mode, data):

    for var in ["X", "Y", "Z", "Red", "Green", "Blue"]:
        if not var in data:
            raise ValueError("Data dictionary does not contain " + var)
    if not (
        data["X"].size
        == data["Y"].size
        == data["Z"].size
        == data["Red"].size
        == data["Green"].size
        == data["Blue"].size
    ):
        raise ValueError("Attributes in data dictionary do not have the same length.")

    if mode == "time":
        if not "GpsTime" in data:
            raise ValueError("Data dictionary does not contain 'GpsTime'")

        i = np.argsort(data["GpsTime"])
        for key in ["Red", "Green", "Blue", "GpsTime", "X", "Y", "Z"]:
            data[key] = data[key][i]

    elif mode == "classes":
        if not "Classification" in data:
            raise ValueError("Data dictionary does not contain 'Classification'")

    return data


def check_point_cloud_data_local(mode, uri, point_cloud_args):

    if os.path.isdir(uri) == False:
        raise ValueError("uri: " + uri + " does not exist.")
    if not "bbox" in point_cloud_args:
        raise ValueError("The bbox for slicing data from the array is not specified")

    data = create_point_cloud(mode, uri, point_cloud_args["bbox"])

    return data


def check_point_cloud_data_cloud(uri, point_cloud_args):

    if not "token" in point_cloud_args:
        token = os.getenv("TILEDB_REST_TOKEN")
        if token == None:
            raise ValueError(
                "The TileDB Cloud token needed to access the array is not specified or cannot be accessed"
            )
        point_cloud_args = {**point_cloud_args, "token": token}

    if not "bbox" in point_cloud_args:
        raise ValueError("The bbox for slicing data from the array is not specified")

    o = urlparse(uri)

    point_cloud_args = {
        **point_cloud_args,
        "name_space": o.netloc,
        "array_name": o.path[1:],
    }

    return point_cloud_args
