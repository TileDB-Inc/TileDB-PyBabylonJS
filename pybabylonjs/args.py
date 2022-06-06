# Copyright 2022 TileDB Inc.
# Licensed under the MIT License.
"""Functions to format and check the keyword arguments for each visualization mode."""

import os
import sys

POINT_CLOUD_KWARG_DEFAULTS = {
    "inspector": False,
    "width": 800,
    "height": 600,
    "z_scale": 1,
    "wheel_precision": -1,
    "point_size": 1,
    "bbox": {"X": [0, 1], "Y": [0, 1], "Z": [0, 1]},
    "time_offset": 0,
}

# "class_numbers": {"type": "array"},
# "class_names": {"type": "array"},
# "topo_offset": {"type": "number", "default": 0},
# "gltf_data": {"type": "string"},


def check_point_cloud_data(source, mode, uri, data, kwargs):

    if source == "dict":
        if not "X" in data:
            sys.exit("Error: data dict does not contain 'X'.")
        if not "Y" in data:
            sys.exit("Error: data dict does not contain 'Y'.")
        if not "Z" in data:
            sys.exit("Error: data dict does not contain 'Z'.")
        if not "Red" in data:
            sys.exit("Error: data dict does not contain 'Red'.")
        if not "Green" in data:
            sys.exit("Error: data dict does not contain 'Green'.")
        if not "Blue" in data:
            sys.exit("Error: data dict does not contain 'Blue'.")
        if not (
            data["X"].size
            == data["Y"].size
            == data["Z"].size
            == data["Red"].size
            == data["Blue"].size
            == data["Green"].size
        ):
            sys.exit("Error: attributes in data dict do not have the same length.")
    elif source == "local":
        # add checks when implementing this functionality - check if args are in array etc
        data_dir = os.path.isdir(uri)
        if data_dir == False:
            sys.exit("Error: array" + uri + " does not exist.")
        else:
            if not "bbox" in kwargs:
                sys.exit("Error: bbox for slicing data from " + uri + " not specified")
    elif source == "cloud":
        # add checks when implementing this functionality
        sys.exit("Error: loading data from TileDB Cloud arrays not yet implemented")
    else:
        sys.exit(
            "Error: unknown value "
            + source
            + ' given for source, needs to be one of one of "cloud", "local" or "dict"'
        )

    if mode == "time":
        try:
            T_len = data["GpsTime"].size
        except:
            sys.exit("Error: data dictionary does not contain 'GpsTime' values.")
    elif mode == "classes":
        try:
            T_len = data["Classification"].size
        except:
            sys.exit("Error: data dictionary does not contain 'Classification' values.")

    return "data accessible"


def check_point_cloud_args(source, mode, uri, data, kwargs):

    # if mode == classes:
    # check for class_numbers and class_names --> replace by a single dict

    # if mode == topo:
    # check for topo_offset, mbtoken, mbstyle and crs, and set z_scale to 0.000004 (temporary)

    # parsed_args = dict(POINT_CLOUD_KWARG_DEFAULTS.keys())
    parsed_args = dict(POINT_CLOUD_KWARG_DEFAULTS)
    for key in POINT_CLOUD_KWARG_DEFAULTS.keys():
        if key in kwargs:
            parsed_args[key] = kwargs.pop(key)

    return parsed_args
