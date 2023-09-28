# Copyright 2023 TileDB Inc.
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
        source: Optional[str] = "cloud",
        streaming: Optional[bool] = False,
        data: Optional[dict] = {},
        **kwargs,
    ):
        """
        Returns a point cloud visualization widget

        :param uri: when source is "cloud" or "local" specify the URI for the TileDB array
        :param source: location of the data to be visualized, one of "cloud", "local" or "dict"
        :param streaming: when true all data will be streamed from the TileDB array
        :param data: when source="dict" this dictionary contains the points to be visualized: {"X", "Y", "Z", "Red", "Green", "Blue"}

        """

        point_cloud_args_in = kwargs

        if source == "dict":
            data = check_point_cloud_data_dict(data)
        if source == "local":
            data = check_point_cloud_data_local(uri, point_cloud_args_in)
        if source == "cloud":
            point_cloud_args_in = check_point_cloud_data_cloud(
                streaming, uri, point_cloud_args_in
            )

        point_cloud_args = check_point_cloud_args(
            source, streaming, point_cloud_args_in
        )

        d = {
            **point_cloud_args,
            "uri": uri,
            "data": data,
            "streaming": streaming,
            "source": source,
        }

        dataviz = BabylonPointCloud()
        dataviz.value = {**d}
        display(dataviz)

    @classmethod
    def from_dict(
        self,
        data: dict,
        uri: Optional[str] = None,
        **kwargs,
    ):
        source = "dict"

        data = check_point_cloud_data_dict(data)

        point_cloud_args = check_point_cloud_args(False, kwargs)

        d = {
            **point_cloud_args,
            "uri": uri,
            "data": data,
            "streaming": False,
            "source": source,
        }

        dataviz = BabylonPointCloud()
        dataviz.value = {**d}
        display(dataviz)

    @classmethod
    def image(
        self,
        **kwargs,
    ):
        image_args = check_image_args(kwargs)

        # d = {**image_args}

        # d = create_image(array_uri, **kwargs)
        dataviz = BabylonImage()
        dataviz.value = {**image_args}
        display(dataviz)
        # create_dataviz(BabylonImage(), **image_args)

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

    def _ipython_display_(self):
        kwargs = check_point_cloud_args("dict", False, {})

        kwargs["source"] = "dict"

        if self.z_scale:
            kwargs["z_scale"] = self.z_scale

        d = {"data": self.value}

        create_dataviz(BabylonPointCloud(), d, **kwargs)
