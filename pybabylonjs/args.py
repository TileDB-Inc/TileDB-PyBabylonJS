# Copyright 2022 TileDB Inc.
# Licensed under the MIT License.
"""Functions to format and check the data and keyword arguments for each data source and visualization mode."""

import os
from urllib.parse import urlparse

from .data import *

POINT_CLOUD_ARGS_DEFAULTS = {
    "width": None,
    "height": None,
    "wheel_precision": None,
    "move_speed": None,
    "inspector": None,
    "color_scheme": None,
    "z_scale": None,
    "gltf_data": None,
    "topo_offset": None,
    "classes": {"numbers": [], "names": []},
    "time_offset": None,
    "distance_colors": None,
    "mesh_rotation": [None, None, None],
    "mesh_shift": [None, None, None],
    "mesh_scale": [None, None, None],
    "gltf_multi": False,
    "show_fraction": None,
    "point_shift": [None, None, None],
    "rgb_max": None,
    "bbox": None,
    "name_space": None,
    "array_name": None,
    "token": None,
    "tiledb_env": None,
    "mbtoken": None,
    "mbstyle": None,
    "crs": None,
    "buffer_size": None,
    "streaming": None,
    "max_levels": None,
    "point_type": None,
    "point_size": None,
    "point_scale": None,
    "point_budget": None,
    "camera_radius": None,
    "edl_strength": None,
    "edl_radius": None,
    "edl_neighbours": None,
    "max_num_cache_blocks": None,
    "fan_out": None,
    "use_shader": None,
    "debug": False,
    "worker_pool_size": None,
}


def check_point_cloud_args(mode, point_cloud_args_in):

    if mode == "time":
        raise ValueError("This mode will be implemented soon")
    if mode == "classes":
        raise ValueError("This mode will be implemented soon")
        if not "classes" in point_cloud_args_in:
            raise ValueError(
                "The classes containing numbers and names is not specified"
            )
    elif mode == "topo":
        raise ValueError("This mode will be implemented soon")
        if not "mbtoken" in point_cloud_args_in:
            raise ValueError("The Mapbox token is not specified")
        if not "crs" in point_cloud_args_in:
            raise ValueError(
                "The crs (coordinate reference system) of the data is not specified"
            )
        if not "bbox" in point_cloud_args_in:
            raise ValueError("The bbox is not specified")
    elif mode == "gltf":
        raise ValueError("This mode will be implemented soon")
        if not "gltf_data" in point_cloud_args_in:
            raise ValueError("gltf_data is not specified")

    point_cloud_args = {}
    for key in POINT_CLOUD_ARGS_DEFAULTS.keys():
        if key in point_cloud_args_in:
            if key is not None:
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


def check_point_cloud_data_cloud(streaming, uri, point_cloud_args):

    if not "token" in point_cloud_args:
        token = os.getenv("TILEDB_REST_TOKEN")
        if token == None:
            raise ValueError(
                "The TileDB Cloud token needed to access the array is not specified or cannot be accessed"
            )
        point_cloud_args = {**point_cloud_args, "token": token}

    if not streaming:
        if not "bbox" in point_cloud_args:
            raise ValueError(
                "The bbox for slicing data from the array is not specified"
            )

    o = urlparse(uri)

    point_cloud_args = {
        **point_cloud_args,
        "name_space": o.netloc,
        "array_name": o.path[1:],
    }

    return point_cloud_args
