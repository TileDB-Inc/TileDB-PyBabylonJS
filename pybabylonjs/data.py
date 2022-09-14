# Copyright 2022 TileDB Inc.
# Licensed under the MIT License.
"""Functions to format data from the arrays to be used in the visualization."""

import io
import numpy as np
import pandas as pd
import cv2
import tiledb


def create_point_cloud(mode, array_uri: str, bbox):

    attrs = ["Red", "Green", "Blue"]

    with tiledb.open(array_uri) as arr:
        data = arr.query(attrs=attrs, dims=["X", "Y", "Z"])[
            bbox["X"][0] : bbox["X"][1],
            bbox["Y"][0] : bbox["Y"][1],
            bbox["Z"][0] : bbox["Z"][1],
        ]

    return data


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


def create_image(array_uri: str, **kwargs):
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
    image_type = kwargs["image_type"]
    sar_scale = kwargs["sar_scale_factor"]

    with tiledb.open(array_uri, "r") as arr:
        img = arr[band, bbox[0] : bbox[1], bbox[2] : bbox[3]][kwargs["attribute"]]

    if image_type == "sar":
        img = 20 * np.log10(img * sar_scale)
        img = ((img - np.min(img)) / (np.max(img) - np.min(img))) * 255
    binary_image = numpy_to_binary(img)

    return dict(data=binary_image)
