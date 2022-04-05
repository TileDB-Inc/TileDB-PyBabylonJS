# Copyright 2022 TileDB Inc.
# Licensed under the MIT License.
"""Functions to format data from the arrays to be used in the visualization."""

# from array import array
import io
import json
from datetime import datetime
import numpy as np
import pandas as pd
import cv2
import tiledb


def create_mbrs(array_uri: str):
    """Create a Dict to be passed on to BabylonMBRS to create MBRS outlines."""
    fragments_info = tiledb.array_fragments(array_uri, include_mbrs=True)

    df = pd.DataFrame()

    f = 0
    for fragment in fragments_info.mbrs:
        f += 1
        b = 0
        for box in fragment:
            b += 1
            box_dict = {
                "fragment": f,
                "box": b,
                "xmin": box[0][0],
                "xmax": box[0][1],
                "ymin": box[1][0],
                "ymax": box[1][1],
                "zmin": box[2][0],
                "zmax": box[2][1],
            }
            box_df = pd.DataFrame([box_dict])
            df = pd.concat([df, box_df], ignore_index=True)

    data = {
        "Xmin": df["xmin"],
        "Xmax": df["xmax"],
        "Ymin": df["ymin"],
        "Ymax": df["ymax"],
        "Zmin": df["zmin"],
        "Zmax": df["zmax"],
    }

    extents = [
        min(df["xmin"].tolist()),
        max(df["xmax"].tolist()),
        min(df["ymin"].tolist()),
        max(df["ymax"].tolist()),
        min(df["zmin"].tolist()),
        max(df["zmax"].tolist()),
    ]

    return dict(extents=extents, data=data)


def create_ground(array_uri: str, **kwargs):
    """Create a Dict to be passed on to BabylonGround containing images as blobs.

    Parameters:
    array_uri: uri of the dense array
    attribute: the attribute to load from the array
    xy_bbox: ranges of x and y to slice data on [x1,x2,y1,y2]
    band: band number to slice from the array
    scale_factor: factor to scale the values in the image
    """

    def numpy_to_binary(arr):
        is_success, buffer = cv2.imencode(".png", arr)
        io_buf = io.BytesIO(buffer)
        return io_buf.read()

    bbox = kwargs["xy_bbox"]
    band = kwargs["band"]
    scale_factor = kwargs["scale_factor"]

    with tiledb.open(array_uri, "r") as arr:
        img = arr[band, bbox[0] : bbox[1], bbox[2] : bbox[3]][kwargs["attribute"]]

    img_norm = 20 * np.log10(img * scale_factor)
    img_png = (
        (img_norm - np.min(img_norm)) / (np.max(img_norm) - np.min(img_norm))
    ) * 255
    binary_image = numpy_to_binary(img_png)

    [img_height, img_width] = np.shape(img)

    return dict(data=binary_image, img_width=img_width, img_height=img_height)
