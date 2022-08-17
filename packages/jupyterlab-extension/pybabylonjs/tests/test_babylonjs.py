#!/usr/bin/env python
# coding: utf-8

# Copyright (c) TileDB, Inc..
# Distributed under the terms of the Modified BSD License.

import pytest

from ..pybabylonjs import BabylonJS


def test_babylonjs_creation_blank():
    w = BabylonJS()
    assert w.value == "Hello World"
