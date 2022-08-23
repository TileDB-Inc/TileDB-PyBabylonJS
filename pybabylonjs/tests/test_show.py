# Copyright 2022 TileDB Inc.
# Licensed under the MIT License.
import numpy as np
import pandas as pd
import pytest

import tiledb
from ..show import Show


class TestShowPointCloudDict:
    @pytest.fixture(scope="class")
    def data_dict(self):

        r = [0, 1, 2, 3, 4]
        ser = pd.Series(r)
        data = {"X": ser, "Y": ser, "Z": ser, "Red": ser, "Green": ser, "Blue": ser}
        return data

    # def test_zero_division(self):
    #    with pytest.raises(ZeroDivisionError):
    #        1 / 0

    def test_empty_dict(self):
        with pytest.raises(ValueError):
            assert Show.point_cloud(source="dict", data={})

    def test_empty_dict2(self):
        with pytest.raises(ValueError) as excinfo:
            Show.point_cloud(source="dict", data={})
            assert "Data dictionary does not contain X" in str(excinfo.value)

    def test_missing_y(self):
        with pytest.raises(ValueError) as excinfo:
            ser = pd.Series([0, 1, 2, 3, 4])
            data = {"X": ser, "YY": ser, "Z": ser, "Red": ser, "Green": ser, "Blue": ser}
            Show.point_cloud(source="dict", data=data)
            # not printing and below should cause the test to fail
            print(excinfo)
            assert "Data dictionary does not contain Z" in str(excinfo.value)
    


# class TestShowPointCloudLocal:

#    @pytest.fixture(scope="class")
#    def array_uri(self, tmpdir_factory):
#        array_uri = str(tmpdir_factory.mktemp("test_array"))
#        schema = tiledb.ArraySchema(
#            domain=tiledb.Domain(
#                tiledb.Dim(name="dim", domain=(0, 0), tile=1, dtype=np.int32)
#            ),
#            attrs=[
#                tiledb.Attr(name="attr", dtype=np.int32),
#            ],
#        )
#        tiledb.Array.create(array_uri, schema)
#        with tiledb.DenseArray(array_uri, mode="w") as array:
#            array.meta["array_key"] = "array_value"
#        return array_uri

# class TestRandom:

#    def test_babylonjs_creation_blank(self):
#        w = Show.point_cloud()
#        print(w.source)
#        assert w.source == "cloud"
