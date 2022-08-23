#!/usr/bin/env python
# coding: utf-8

# Copyright (c) TileDB, Inc..
# Distributed under the terms of the Modified BSD License.


from ..show import BabylonJS


def test_babylonjs_creation_blank():
    w = BabylonJS()
    print(w.value)
    assert w.value == None
