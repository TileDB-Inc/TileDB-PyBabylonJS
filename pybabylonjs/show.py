# Copyright 2022 TileDB Inc.
# Licensed under the MIT License.
"""Classes for setting up the visualization."""

from IPython.display import display
from typing import Optional

from .babylonjs import BabylonPointCloud, BabylonMBRS, BabylonImage
from .data import *


def create_dataviz(dataviz, d, **kwargs):
    dataviz.value = {**d, **kwargs}
    display(dataviz)


class PyBabylonJSError(Exception):
    pass


class Show:
    """Create a N-D visualization.

    Parameters:
        ...
    """

    def __init__(self):
        self._value = None
        self._dataviz = None

    @classmethod
    def point_cloud(
        self,
        source: Optional[str] = "cloud",
        time: Optional[bool] = False,
        classes: Optional[bool] = False,
        topo: Optional[bool] = False,
        **kwargs,
    ):
        if source == "dict":
            #
        elif source == "local":
            #
        else:
            # 
        # d = create_point_cloud(array_uri, **kwargs)
        # d = {**d, "classes": classes, "time": time, "topo": topo}
        d = {"classes": classes, "time": time, "topo": topo}
        if topo:
            img = create_mapbox_image(**kwargs)
            d = {**d, "mapbox_img": img}
        create_dataviz(BabylonPointCloud(), d, **kwargs)

    @classmethod
    def image(
        self,
        array_uri: str,
        **kwargs,
    ):
        d = create_image(array_uri, **kwargs)
        create_dataviz(BabylonImage(), d, **kwargs)

    @classmethod
    def mbrs(
        self,
        array_uri: str,
        **kwargs,
    ):
        d = create_mbrs(array_uri)
        create_dataviz(BabylonMBRS(), d, **kwargs)

    @classmethod
    def from_dict(
        self,
        data: dict,
        time: Optional[bool] = False,
        classes: Optional[bool] = False,
        topo: Optional[bool] = False,
        **kwargs,
    ):
        d = {
            "classes": classes,
            "time": time,
            "topo": topo,
            "data": data,
            "bbox": {
            "X": [636800, 637800],
            "Y": [851000, 853000],
            "Z": [406.14, 615.26],
        },
        }
        if topo:
            img = create_mapbox_image(data, **kwargs)
            d = {**d, "mapbox_img": img}
        create_dataviz(BabylonPointCloud(), d, **kwargs)


class BabylonJS:
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

        d = {"data": self.value}
        create_dataviz(BabylonPointCloud(), d, **kwargs)
