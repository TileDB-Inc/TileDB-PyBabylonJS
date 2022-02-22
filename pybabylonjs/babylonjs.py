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
import json, jsonschema
import os
from traitlets import CInt, Float, Dict, List, Bool, TraitError, Unicode, validate, HasTraits
from ._frontend import module_name, module_version
import pandas as pd

pc_schema = {
    'type' : 'object',
    'style' : {'type' : 'string'},
    'width' : {'type' : 'number'},
    'height' :{'type' : 'number'},
    'data' : {
        'X' : { 'type' : 'number' },
        'Y' : { 'type' : 'number' },
        'Y' : { 'type' : 'number' },
        'Red' : { 'type' : 'number' },
        'Green' : { 'type' : 'number' },
        'Blue' : { 'type' : 'number' },
    },
}

mbrs_schema = {
    'type' : 'object',
    'style' : {'type' : 'string'},
    'width' : {'type' : 'number'},
    'height' :{'type' : 'number'},
    'z_scale' : {'type' : 'number'},
    'extents' : {'type' : 'number'},
    'data' : {
        'X' : { 'type' : 'number' },
        'Y' : { 'type' : 'number' },
        'Y' : { 'type' : 'number' },
        'H' : { 'type' : 'number' },
        'W' : { 'type' : 'number' },
        'D' : { 'type' : 'number' },
    },
}

@register
class BabylonPC(DOMWidget):
    """3D point cloud with BabylonJS"""
    _model_name = Unicode("BabylonPCModel").tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode("BabylonPCView").tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    value = Dict().tag(sync=True)

    @validate("value")
    def _valid_value(self, proposal):
        if proposal.value:
            reqd = ["X", "Y", "Z", "Red", "Green", "Blue"]
            if not all(key in proposal.value['data'].keys() for key in reqd):
                raise TraitError(f"Missing one of {reqd} in input")
        else:
            return proposal.value

    @validate('value')
    def _validate_value(self, proposal):
        try:
            jsonschema.validate(proposal['value'], pc_schema)
        except jsonschema.ValidationError as e:
            raise TraitError(e)
        return proposal['value']

@register
class BabylonMBRS(DOMWidget):
    """MBRS outlines with BabylonJS"""
    _model_name = Unicode("BabylonMBRSModel").tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode("BabylonMBRSView").tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    value = Dict().tag(sync=True)
    
    @validate("value")
    def _valid_value(self, proposal):
        if proposal.value:
            reqd = ["X", "Y", "Z", "H", "W", "D"]
            if not all(key in proposal.value['data'] for key in reqd):
                raise TraitError(f"Missing one of {reqd} in input")
        else:
            return proposal.value
    
    @validate('value')
    def _validate_value(self, proposal):
        try:
            jsonschema.validate(proposal['value'], mbrs_schema)
        except jsonschema.ValidationError as e:
            raise TraitError(e)
        return proposal['value']
     
