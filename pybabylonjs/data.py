# Copyright 2022 TileDB Inc.
# Licensed under the MIT License.
"""Functions to format data from the arrays to be used in the visualization."""

import io
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


def create_mapbox_image(data: dict, **kwargs):
    """Create a Dict with an additional topographic image from mapbox

    Parameters:
    """
    import requests
    from rasterio.coords import BoundingBox
    from rasterio.warp import transform_bounds

    mbtoken = kwargs["mbtoken"]
    style_id = kwargs["mbstyle"]
    data_crs = kwargs["crs"]

    dst_crs = {"init": "EPSG:4326"}  # lat/lon

    bbox = BoundingBox(
        data["X"].min(), data["Y"].min(), data["X"].max(), data["Y"].max()
    )

    dst_bbox = transform_bounds(data_crs, dst_crs, *bbox)

    print(bbox)
    print(dst_bbox)

    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]

    if w > h:
        ww = 1280
        hh = int(h / w * 1280)
    elif h > w:
        hh = 1280
        ww = int(w / h * 1280)

    print(ww)
    print(hh)

    f = requests.get(
        (
            "https://api.mapbox.com/styles/v1/mapbox/"
            + style_id
            + "/static/["
            + str(dst_bbox[0])
            + ","
            + str(dst_bbox[1])
            + ","
            + str(dst_bbox[2])
            + ","
            + str(dst_bbox[3])
            + "]/"
            + str(ww)
            + "x"
            + str(hh)
            + "?access_token="
            + mbtoken
        )
    )

    return f.content
