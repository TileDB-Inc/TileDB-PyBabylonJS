#!/usr/bin/env python
# coding: utf-8

# Copyright 2022 TileDB Inc.
# Licensed under the MIT License.

"""
BabylonJS Jupyter Widget
"""
import logging

logger = logging.Logger("logger")

from ipywidgets import DOMWidget, register

from traitlets import Dict, Unicode
from ._frontend import module_name, module_version


class BabylonBase(DOMWidget):
    """Base class for all Babylon derived widgets"""

    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)


@register
class BabylonPointCloud(BabylonBase):
    """3D point cloud with BabylonJS"""

    _model_name = Unicode("BabylonPointCloudModel").tag(sync=True)
    _view_name = Unicode("BabylonPointCloudView").tag(sync=True)
    value = Dict().tag(sync=True)


@register
class BabylonMBRS(BabylonBase):
    """MBRS outlines with BabylonJS"""

    _model_name = Unicode("BabylonMBRSModel").tag(sync=True)
    _view_name = Unicode("BabylonMBRSView").tag(sync=True)
    value = Dict().tag(sync=True)


@register
class BabylonImage(BabylonBase):
    """Ground surface as 2D array with BabylonJS"""

    _model_name = Unicode("BabylonImageModel").tag(sync=True)
    _view_name = Unicode("BabylonImageView").tag(sync=True)
    value = Dict().tag(sync=True)
