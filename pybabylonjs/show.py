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
        data: dict,
        time: Optional[bool] = False,
        classes: Optional[bool] = False,
        # topo: Optional[bool] = False,
        **kwargs,
    ):
        d = {"classes": classes, "time": time, "data": data}
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
