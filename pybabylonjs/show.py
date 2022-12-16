# Copyright 2022 TileDB Inc.
# Licensed under the MIT License.

"""Classes for setting up the visualization."""

from IPython.display import display
from typing import Optional
from enum import Enum

from .args import *
from .data import *
from .babylonjs import BabylonPointCloud, BabylonMBRS, BabylonImage


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
        uri: Optional[str] = None,
        data: Optional[dict] = {},
        streaming: Optional[bool] = False,
        source: Optional[str] = "cloud",
        mode: Optional[str] = "default",
        **kwargs,
    ):
        """
        Returns a point cloud visualization widget

        :param uri: when source is "cloud" or "local" specify the URI for the TileDB array
        :param data: when source="dict" this dictionary contains the points to be visualized: {"X", "Y", "Z", "Red", "Green", "Blue"}
        :param streaming: when true all data will be streamed from the TileDB array
        :param source: location of the data to be visualized, one of "cloud", "local" or "dict"
        :param mode: sub-type of the visualization, one of "default", "time", "classes" or "topo"

        """

        point_cloud_args_in = kwargs

        if source == "dict":
            data = check_point_cloud_data_dict(mode, data)
        if source == "local":
            data = check_point_cloud_data_local(mode, uri, point_cloud_args_in)
        if source == "cloud":
            point_cloud_args_in = check_point_cloud_data_cloud(
                streaming, uri, point_cloud_args_in
            )

        point_cloud_args = check_point_cloud_args(mode, point_cloud_args_in)

        d = {
            **point_cloud_args,
            "uri": uri,
            "data": data,
            "streaming": streaming,
            "source": source,
            "mode": mode,
        }

        if mode == "topo":
            img = create_mapbox_image(data, point_cloud_args)
            d = {**d, "mapbox_img": img}

        dataviz = BabylonPointCloud()
        dataviz.value = {**d}
        display(dataviz)

    @classmethod
    def from_dict(
        self,
        data: dict,
        time: Optional[bool] = False,
        classes: Optional[bool] = False,
        topo: Optional[bool] = False,
        uri: Optional[str] = None,
        **kwargs,
    ):

        source = "dict"

        if time:
            mode = "time"
        elif classes:
            raise ValueError(
                "This mode is not implemented for show.from_dict(), use show.point_cloud() instead"
            )
        else:
            mode = "default"

        data = check_point_cloud_data_dict(mode, data)

        point_cloud_args = check_point_cloud_args(mode, kwargs)

        d = {
            **point_cloud_args,
            "uri": uri,
            "data": data,
            "source": source,
            "mode": mode,
        }

        if mode == "topo":
            img = create_mapbox_image(data, point_cloud_args)
            d = {**d, "mapbox_img": img}

        dataviz = BabylonPointCloud()
        dataviz.value = {**d}
        display(dataviz)

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

        kwargs = check_point_cloud_args("default", {})

        kwargs["source"] = "dict"

        if self.z_scale:
            kwargs["z_scale"] = self.z_scale

        if self.width:
            kwargs["width"] = self.width

        if self.height:
            kwargs["height"] = self.height

        d = {"data": self.value}

        create_dataviz(BabylonPointCloud(), d, **kwargs)
