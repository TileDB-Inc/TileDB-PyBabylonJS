# Copyright 2023 TileDB Inc.
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
    "rgb_max": None,
    "bbox": None,
    "name_space": None,
    "group_name": None,
    "array_name": None,
    "token": None,
    "tiledb_env": None,
    "crs": None,
    "buffer_size": None,
    "streaming": None,
    "point_type": None,
    "point_size": None,
    "point_budget": None,
    "camera_location": None,
    "camera_zoom": [None, None, None],
    "camera_up": None,
    "edl_strength": None,
    "edl_radius": None,
    "edl_neighbours": None,
    "use_shader": None,
    "use_sps": None,
    "debug": False,
    "worker_pool_size": None,
}

IMAGE_ARGS_DEFAULTS = {
    "width": None,
    "height": None,
    "wheel_precision": None,  # used? in base class?
    "move_speed": None,  # used?
    "name_space": None,
    "array_name": None,
    "group_name": None,
    "geometry_array_names": None,
    "point_group_names": None,
    "base_group": None,
    "token": None,
    "tiledb_env": None,
    "default_channels": None,
}


def in_pixels(h, default):
    if h is None:
        return default
    if isinstance(h, str):
        if "px" in h:
            return h
        return h + "px"
    if isinstance(h, int):
        return str(h) + "px"
    if isinstance(h, float):
        return str(int(h)) + "px"


def check_image_args(image_args_in):
    image_args = {}
    for key in IMAGE_ARGS_DEFAULTS.keys():
        if key in image_args_in:
            if key is not None:
                image_args[key] = image_args_in.pop(key)

    image_args["height"] = in_pixels(image_args.get("height"), "500px")
    image_args["width"] = in_pixels(image_args.get("width"), "700px")

    if not "token" in image_args:
        try:
            token = os.getenv("TILEDB_REST_TOKEN")
        except:
            if token == None:
                raise ValueError(
                    "The TileDB Cloud token needed to access the array is not specified or cannot be accessed"
                )
        image_args = {**image_args, "token": token}

    return image_args


def check_point_cloud_args(source, streaming, point_cloud_args_in):
    point_cloud_args = {}
    for key in POINT_CLOUD_ARGS_DEFAULTS.keys():
        if key in point_cloud_args_in:
            if key is not None:
                point_cloud_args[key] = point_cloud_args_in.pop(key)

    point_cloud_args["height"] = in_pixels(point_cloud_args.get("height"), "500px")
    point_cloud_args["width"] = in_pixels(point_cloud_args.get("width"), "700px")

    if not "token" in point_cloud_args:
        try:
            token = os.getenv("TILEDB_REST_TOKEN")
        except:
            if source == "cloud" & token == None:
                raise ValueError(
                    "The TileDB Cloud token needed to access the array is not specified or cannot be accessed"
                )
        point_cloud_args = {**point_cloud_args, "token": token}

    return point_cloud_args


def check_point_cloud_data_dict(data):
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

    return data


def check_point_cloud_data_local(uri, point_cloud_args):
    if os.path.isdir(uri) == False:
        raise ValueError("uri: " + uri + " does not exist.")
    if not "bbox" in point_cloud_args:
        raise ValueError("The bbox for slicing data from the array is not specified")

    data = create_point_cloud(uri, point_cloud_args["bbox"])

    return data


def check_point_cloud_data_cloud(streaming, uri, point_cloud_args):
    o = urlparse(uri)

    if not streaming:
        if not "bbox" in point_cloud_args:
            raise ValueError(
                "The bbox for slicing data from the array is not specified"
            )
        point_cloud_args = {
            **point_cloud_args,
            "name_space": o.netloc,
            "array_name": o.path[1:],
        }
    else:
        point_cloud_args = {
            **point_cloud_args,
            "name_space": o.netloc,
            "group_name": o.path[1:],
        }

    return point_cloud_args
