# Copyright 2022 TileDB Inc.
# Licensed under the MIT License.
"""Classes for setting up the visualization."""

from IPython.display import display
from typing import Optional
from enum import Enum

from .args import *
from .data import *
from .babylonjs import BabylonPointCloud, BabylonMBRS, BabylonImage

# class DataSource(Enum):
#    CLOUD = "cloud"
#    LOCAL = "local"
#    DICT = "dict"


def create_dataviz(dataviz, d, **kwargs):
    dataviz.value = {**d, **kwargs}
    display(dataviz)


class PyBabylonJSError(Exception):
    pass


class Show:
    """Create a N-D visualization."""

    def __init__(self):
        self._value = None
        self._dataviz = None

    @classmethod
    def point_cloud(
        self,
        # source: DataSource = DataSource.DICT,
        uri: Optional[str] = "uri",
        data: Optional[dict] = {},
        source: Optional[str] = "cloud",
        mode: Optional[str] = "default",
        **kwargs,
    ):
        """
        Returns a point cloud visualization widget

        :param uri: URI for the TileDB array (any supported TileDB URI) when source is "cloud" or "local"
        :param data: dictionary containing the points to be visualized, when type="dict" containing {"X", "Y", "Z", "Red", "Green", "Blue"}
        :param source: location of the data to be visualized, one of "cloud", "local" or "dict"
        :param mode: sub-type of the visualization, one of "default", "time", "classes" or "topo"

        Keyword Arguments:


        """
        check_point_cloud_data(source, mode, uri, data, kwargs)

        point_cloud_args = check_point_cloud_args(source, mode, uri, data, kwargs)

        d = {
            **point_cloud_args,
            "uri": uri,
            "data": data,
            "source": source,
            "mode": mode,
        }

        print(d)

        if mode == "topo":
            img = create_mapbox_image(data, **kwargs)
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
        d = {"classes": classes, "time": time, "topo": topo, "data": data}
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
