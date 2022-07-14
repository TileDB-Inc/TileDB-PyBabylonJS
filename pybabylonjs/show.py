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
        source: Optional[str] = "cloud",
        mode: Optional[str] = "default",
        **kwargs,
    ):
        """
        Returns a point cloud visualization widget

        :param uri: when source is "cloud" or "local" specify the URI for the TileDB array
        :param data: when source="dict" this dictionary contains the points to be visualized: {"X", "Y", "Z", "Red", "Green", "Blue"}
        :param source: location of the data to be visualized, one of "cloud", "local" or "dict"
        :param mode: sub-type of the visualization, one of "default", "time", "classes" or "topo"

        :Keyword Arguments:

        * **bbox** - ...
        * **classes** - ...
        * **time_offset** - ...
        *


        """

        #if source == "dict":
        #    data = check_point_cloud_data_dict(mode, data)
        #if source == "local":
        #    data = check_point_cloud_data_local(mode, uri, kwargs)
        #if source == "cloud":
        #    check_point_cloud_data_cloud(kwargs)

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

        self._dataviz = BabylonPointCloud()
        self._dataviz.value = {**d}
        display(self._dataviz)

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
    def cmd(
        self,
        info: Optional[dict] = {},
    ):
        source = info['source']
        mode = info['mode']

        if source == "dict" and mode != "gltf":
            data = check_point_cloud_data_dict(info['mode'], info['data'])
            info['data'] = data
        if source == "local":
            data = check_point_cloud_data_local(info['mode'], info['uri'], { 'bbox': info['bbox'] })
            info['data'] = data
        if source == "cloud":
            check_point_cloud_data_cloud(**{ 'name_space': info['name_space'], 'array_name': info['array_name'], 'token': info['token'], 'bbox': info['bbox'] })

        if mode == "topo":
            img = create_mapbox_image(data, point_cloud_args)
            d = {**d, "mapbox_img": img}

        self._dataviz.send(info)



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
