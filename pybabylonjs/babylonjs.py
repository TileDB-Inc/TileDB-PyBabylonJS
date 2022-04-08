#!/usr/bin/env python
# coding: utf-8

# Copyright (c) TileDB, Inc..
# Distributed under the terms of the Modified BSD License.

"""
BabylonJS Jupyter Widget
"""
import logging

logger = logging.Logger("logger")

from copy import deepcopy
from ipywidgets import DOMWidget, register
import jsonschema
from jsonschema import Draft7Validator, validators
from traitlets import Dict, TraitError, Unicode, validate
from ._frontend import module_name, module_version


def extend_with_default(validator_class):
    validate_properties = validator_class.VALIDATORS["properties"]

    def set_defaults(validator, properties, instance, schema):
        for property, subschema in properties.items():
            if "default" in subschema:
                instance.setdefault(property, subschema["default"])

        for error in validate_properties(
            validator,
            properties,
            instance,
            schema,
        ):
            yield error

    return validators.extend(
        validator_class,
        {"properties": set_defaults},
    )


DefaultValidatingDraft7Validator = extend_with_default(Draft7Validator)


core_schema = {
    "type": "object",
    "properties": {
        "inspector": {"type": "boolean", "default": False},
        "width": {"type": "number", "default": 800},
        "height": {"type": "number", "default": 600},
        "z_scale": {"type": "number", "default": 1},
        "wheel_precision": {"type": "number", "default": -1},
        "time": {"type": "boolean", "default": False},
        "time_offset": {"type": "number", "default": 0},
        "gltf_data": {"type": "string"},
        "point_size": {"type": "number", "default": 1},
        "data": {"type": "object", "properties": {}, "required": []},
        "extents": {"type": "array", "items": {"type": "number"}, "maxItems": 6},
    },
    "required": ["data"],
}

pc_schema = deepcopy(core_schema)
attrs = ["X", "Y", "Z", "Red", "Green", "Blue"]
pc_schema["properties"]["data"]["required"].extend(attrs)

mbrs_schema = deepcopy(core_schema)

ground_schema = {
    "type": "object",
    "properties": {
        "inspector": {"type": "boolean", "default": False},
        "image_type": {"type": "string", "default": "general"},
        "width": {"type": "number", "default": 800},
        "height": {"type": "number", "default": 600},
        "z_scale": {"type": "number", "default": 1},
        "wheel_precision": {"type": "number", "default": -1},
        "xy_bbox": {"type": "array", "default": [0, 1, 0, 1]},
        "band": {"type": "number", "default": 1},
        "scale_factor": {"type": "number", "default": 1},
        "img_width": {"type": "number"},
        "img_height": {"type": "number"},
    },
    "required": ["xy_bbox", "img_width"],
}


class BabylonBase(DOMWidget):
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)

    """Base class for all Babylon derived widgets"""

    @validate("value")
    def _validate_value(self, proposal):
        try:
            DefaultValidatingDraft7Validator(self._schema).validate(proposal["value"])
            return proposal["value"]
        except jsonschema.ValidationError as e:
            raise TraitError(e)


@register
class BabylonPC(BabylonBase):
    """3D point cloud with BabylonJS"""

    _model_name = Unicode("BabylonPCModel").tag(sync=True)
    _view_name = Unicode("BabylonPCView").tag(sync=True)
    value = Dict().tag(sync=True)
    _schema = pc_schema


@register
class BabylonMBRS(BabylonBase):
    """MBRS outlines with BabylonJS"""

    _model_name = Unicode("BabylonMBRSModel").tag(sync=True)
    _view_name = Unicode("BabylonMBRSView").tag(sync=True)
    value = Dict().tag(sync=True)
    _schema = mbrs_schema


@register
class BabylonGround(BabylonBase):
    """Ground surface as 2D array with BabylonJS"""

    _model_name = Unicode("BabylonGroundModel").tag(sync=True)
    _view_name = Unicode("BabylonGroundView").tag(sync=True)
    value = Dict().tag(sync=True)
    _schema = ground_schema
