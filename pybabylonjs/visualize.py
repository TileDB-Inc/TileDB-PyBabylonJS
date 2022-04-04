# Copyright 2022 TileDB Inc.
# Licensed under the MIT License.
"""Classes for setting up the visualization."""

from IPython.display import display
from typing import Optional

from .babylonjs import BabylonPC, BabylonMBRS, BabylonGround
from .data import *


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
    def from_dict(self, data: dict, style: str, time: Optional[bool] = False, **kwargs):
        if style == "pointcloud":
            dataviz = BabylonPC()
            d = {"time": time, "data": data}
            dataviz.value = {**d, **kwargs}
            display(dataviz)
        else:
            raise PyBabylonJSError(f"Unsupported style {style}")

    @classmethod
    def from_array(
        self,
        array_uri: str,
        style: str,
        **kwargs,
    ):
        if style == "mbrs":
            dataviz = BabylonMBRS()
            d = create_mbrs(array_uri)
        if style == "ground":
            dataviz = BabylonGround()
            d = create_ground(array_uri, **kwargs)
        else:
            raise PyBabylonJSError(f"Unsupported style {style}")

        dataviz.value = {**d, **kwargs}
        display(dataviz)


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

        Show.from_dict(data=self.value, style="pointcloud", **kwargs)
