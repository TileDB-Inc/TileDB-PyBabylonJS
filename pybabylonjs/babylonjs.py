#!/usr/bin/env python
# coding: utf-8

# Copyright (c) TileDB, Inc..
# Distributed under the terms of the Modified BSD License.

"""
BabylonJS Jupyter Widget
"""
import logging

logger = logging.Logger("logger")

from ipywidgets import DOMWidget, register
import jsonschema
from traitlets import Dict, TraitError, Unicode, validate
from ._frontend import module_name, module_version


core_schema = {
    "properties": {
        "style" : {"type" : "string"},
        "width" : {"type" : "number"},
        "height" :{"type" : "number"},
        "z_scale":{"type": "number"},
        "wheel_precision":{"type": "number"},
        "data" : {
            "X" : { "type": "array", "items": { "type" : "number" } },
            "Y" : { "type": "array", "items": { "type" : "number" } },
            "Z" : { "type": "array", "items": { "type" : "number" } },
        }
    }
}

pc_schema = core_schema.copy()
for c in ["Red", "Green", "Blue"]:
    pc_schema["properties"]["data"][c] = { "type": "number" }


mbrs_schema = core_schema.copy()
mbrs_schema["properties"]["extents"] = {
    "type": "array",
    "items": {"type" : "number"},
    "maxItems": 6  
    }

for d in ["H", "W", "D"]:
    mbrs_schema["properties"]["data"][d] = { "type": "number" }


class BabylonBase(DOMWidget):
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    value = Dict().tag(sync=True)


    """Base class for all Babylon derived widgets"""
    @validate("value")
    def _validate_value(self, proposal):
        try:
            jsonschema.validate(instance=proposal["value"], schema=self._schema)
            return proposal["value"]
        except jsonschema.ValidationError as e:
            raise TraitError(e)


@register
class BabylonPC(BabylonBase):
    """3D point cloud with BabylonJS"""
    _model_name = Unicode("BabylonPCModel").tag(sync=True)
    _view_name = Unicode("BabylonPCView").tag(sync=True)
    _schema = pc_schema


@register
class BabylonMBRS(BabylonBase):
    """MBRS outlines with BabylonJS"""
    _model_name = Unicode("BabylonMBRSModel").tag(sync=True)
    _view_name = Unicode("BabylonMBRSView").tag(sync=True)
    _schema = mbrs_schema
     
