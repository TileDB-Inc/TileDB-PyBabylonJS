# Copyright 2022 TileDB Inc.
# Licensed under the MIT License.
"""Classes for setting up the visualization."""

from IPython.display import display
from typing import Optional 

import pandas as pd
import tiledb

from .babylonjs import BabylonPC, BabylonMBRS


class PyBabylonJSError(Exception):
    pass


def create_mbrs(array_name:str):
    """Create a Dict to be passed on to BabylonMBRS to create a 3D point cloud visualization.
    """  
    fragments_info = tiledb.array_fragments(array_name, include_mbrs=True)
    
    df = pd.DataFrame()   

    f = 0
    for fragment in fragments_info.mbrs:
        f += 1
        b = 0
        for box in fragment:
            b += 1
            box_dict = {"fragment": f, "box": b, "xmin": box[0][0], "xmax": box[0][1],
                    "ymin": box[1][0], "ymax": box[1][1],
                    "zmin": box[2][0], "zmax": box[2][1]}
            box_df = pd.DataFrame([box_dict])           
            df = pd.concat([df, box_df], ignore_index=True)

    data = {
    'Xmin': df['xmin'],
    'Xmax': df['xmax'],
    'Ymin': df['ymin'],
    'Ymax': df['ymax'],
    'Zmin': df['zmin'],
    'Zmax': df['zmax'],
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


class Show:
    """Create a N-D visualization.

    Parameters:
        ...
    """

    def __init__(self):
        self._value = None
        self._dataviz = None

    @classmethod
    def from_dict(self,
        data: dict,
        style: str,
        time: Optional[bool] = False,
        **kwargs
    ):
        if style == "pointcloud": 
            dataviz = BabylonPC()
            d = {
                "time": time,
                "data" : data
            }
            d.update(kwargs)
            dataviz.value = d
            display(dataviz)
        else:
            raise PyBabylonJSError(f"Unsupported style {style}")

    @classmethod
    def from_array(self, array_uri: str, style:str, **kwargs):
        if style == "mbrs":
            dataviz = BabylonMBRS()
            d = create_mbrs(array_uri)
            d.update(kwargs)
            dataviz.value = d
            display(dataviz)
        else:
            raise PyBabylonJSError(f"Unsupported style {style}")


class BabylonJS():
    """Legacy class for instantiating the widget"""
    

    def __init__(self):
        self.value = None
        self.z_scale = None
        self.width = None
        self.height = None


    def _ipython_display_(self):
        kwargs = {}

        if self.z_scale:
            kwargs["z_scale"] = self.z_scale

        if self.width:
            kwargs["width"] = self.width

        if self.height:
            kwargs["height"] = self.height

        Show.from_dict(
            data = self.value,
            style="pointcloud",
            **kwargs
        )