# Copyright 2022 TileDB Inc.
# Licensed under the MIT License.
"""Functions to format and check the data and keyword arguments for each data source and visualization mode."""

import os

from .data import *

POINT_CLOUD_KWARG_DEFAULTS = {
    "inspector": False,
    "width": 800,
    "height": 600,
    "z_scale": 1,
    "wheel_precision": -1,
    "point_size": 1,
    "background_color": [0, 0, 0, 1],
    "bbox": {"X": [0, 1], "Y": [0, 1], "Z": [0, 1]},
    "time_offset": 0,
    "classes": {"numbers": [], "names": []},
    "mbtoken": None,
    "mbstyle": "streets-v11",
    "crs": "EPSG:2994",
    "topo_offset": 0,
    "gltf_data": None,
    "name_space": None,
    "array_name": None,
    "token": None,
    "tiledb_env": "prod",
}


def check_point_cloud_args(mode, kwargs):

    if mode == "classes":
        if not "classes" in kwargs:
            raise ValueError(
                "The classes containing numbers and names is not specified"
            )
    elif mode == "topo":
        if not "mbtoken" in kwargs:
            raise ValueError("The Mapbox token is not specified")
        if not "crs" in kwargs:
            raise ValueError(
                "The crs (coordinate reference system) of the data is not specified"
            )
    elif mode == "gltf":
        if not "gltf_data" in kwargs:
            raise ValueError("gltf_data is not specified")

    parsed_args = dict(POINT_CLOUD_KWARG_DEFAULTS)
    for key in POINT_CLOUD_KWARG_DEFAULTS.keys():
        if key in kwargs:
            parsed_args[key] = kwargs.pop(key)

    return parsed_args


def check_point_cloud_data_dict(mode, data):

    for var in ["X", "Y", "Z", "Red", "Green", "Blue"]:
        if not var in data:
            raise ValueError("Data dictionary does not contain " + var)
    if not (
        data["X"].size
        == data["Y"].size
        == data["Z"].size
        == data["Red"].size
        == data["Blue"].size
        == data["Green"].size
    ):
        raise ValueError("Attributes in data dictionary do not have the same length.")

    if mode == "time":
        if not "GpsTime" in data:
            raise ValueError("Data dictionary does not contain 'GpsTime'")

        i = np.argsort(data["GpsTime"])
        for key in ["X", "Y", "Z", "Red", "Green", "Blue", "GpsTime"]:
            data[key] = data[key][i]

    elif mode == "classes":
        if not "Classification" in data:
            raise ValueError("Data dictionary does not contain 'Classification'")

    return data


def check_point_cloud_data_local(mode, uri, kwargs):

    if os.path.isdir(uri) == False:
        raise ValueError("uri: " + uri + " does not exist.")
    if not "bbox" in kwargs:
        raise ValueError("The bbox for slicing data from " + uri + " is not specified")

    data = create_point_cloud(mode, uri, kwargs)

    return data


def check_point_cloud_data_cloud(uri, kwargs):

    if not "token" in kwargs:
        token = os.getenv("TILEDB_REST_TOKEN")
        if token == None:
            raise ValueError(
                "The TileDB Cloud token needed to access the array is not specified or cannot be accessed"
            )
        kwargs = {**kwargs, "token": token}

    if not "bbox" in kwargs:
        raise ValueError("The bbox for slicing data from the array is not specified")

    name_space = uri.split("://")[1].split("/")[0]
    array_name = uri.split("://")[1].split("/")[1]

    kwargs = {
        **kwargs,
        "name_space": name_space,
        "array_name": array_name,
    }

    return kwargs
