#!/usr/bin/env python
# coding: utf-8

# Copyright (c) TileDB, Inc..
# Distributed under the terms of the Modified BSD License.

"""
BabylonJS Jupyter Widget
"""

from ipywidgets import DOMWidget
import json
import os
from traitlets import CInt, Float, Dict, List, TraitError, Unicode, validate
from ._frontend import module_name, module_version


class BabylonJS(DOMWidget):
    """BabylonJS"""

    _model_name = Unicode("BabylonJSModel").tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode("BabylonJSView").tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    extents = List().tag(sync=True)
    width = CInt(700).tag(sync=True)
    height = CInt(500).tag(sync=True)
    query = Dict().tag(sync=True)
    token = Unicode(os.getenv("TILEDB_REST_TOKEN", "")).tag(sync=True)
    uri = Unicode().tag(sync=True)
    value = Dict().tag(sync=True)
    z_scale = Float(0.5).tag(sync=True)

    @validate("value")
    def _valid_value(self, proposal):
        if proposal.value:
            reqd = ["X", "Y", "Z", "Red", "Green", "Blue"]

            if not all(key in proposal.value.keys() for key in reqd):
                raise TraitError(f"Missing one of {reqd} in input")

            data = {}
            data["X"] = proposal.value["X"].tolist()
            data["Y"] = proposal.value["Y"].tolist()
            data["Z"] = proposal.value["Z"].tolist()
            data["Red"] = proposal.value["Red"].tolist()
            data["Green"] = proposal.value["Green"].tolist()
            data["Blue"] = proposal.value["Blue"].tolist()

            self.extents = [
                min(data["X"]),
                max(data["X"]),
                min(data["Y"]),
                max(data["Y"]),
                min(data["Z"]),
                max(data["Z"]),
            ]

            return json.dumps(data)
        else:
            return proposal.value
