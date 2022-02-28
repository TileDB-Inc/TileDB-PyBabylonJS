# Copyright 2022 TileDB Inc.
# Licensed under the MIT License.
"""Classes for setting up the visualization."""

from IPython.display import display
from typing import Optional 

import pandas as pd
import tiledb

from .babylonjs import BabylonPC, BabylonMBRS


def fragment_mbrs(array):

    fragments_info = tiledb.array_fragments(array,include_mbrs=True)
    
    df = pd.DataFrame()   

    f=0
    for fragment in fragments_info.mbrs:
        f+=1
        b=0
        for box in fragment:
            b+=1
            box_dict = {'fragment': f, 'box': b, 'xmin': box[0][0], 'xmax': box[0][1],
                    'ymin': box[1][0], 'ymax': box[1][1],
                    'zmin': box[2][0], 'zmax': box[2][1]}
            box_df = pd.DataFrame([box_dict])           
            df = pd.concat([df, box_df], ignore_index=True)

    data = {
    'Xmin': df['xmin'],
    'Xmax': df['xmax'],
    'Ymin': df['ymin'],
    'Ymax': df['ymax'],
    'Zmin': df['zmin'],
    'Zmax': df['zmax'],
    }    

    extents = [ 
                min(df["xmin"].tolist()),
                max(df["xmax"].tolist()),
                min(df["ymin"].tolist()),
                max(df["ymax"].tolist()),
                min(df["zmin"].tolist()),
                max(df["zmax"].tolist()),
            ]

    return data, extents
    
def pointcloud_schema(
        data: dict,
        style: str,
        width: Optional[float] = 800,
        height: Optional[float] = 600,
        z_scale: Optional[float] = 0.2,
        wheel_precision: Optional[float] = 50,
        time: Optional[bool] = None,
        ):
    """Create a Dict to be passed on to BabylonPC to create a 3D point cloud visualization.
    """
    
    if time == True:
        fourD_agg_df = (
            pd.DataFrame(data)
            .groupby("GpsTime", sort=False, as_index=False)
            .agg(lambda x: list(x))
        )
        data = {
                'X': fourD_agg_df["X"],
                'Y': fourD_agg_df["Y"],
                'Z': fourD_agg_df["Z"],
                'Red': fourD_agg_df["Red"],
                'Green': fourD_agg_df["Green"],
                'Blue': fourD_agg_df["Blue"],
                'GpsTime': fourD_agg_df["GpsTime"]}

    extents = [ 
                min(data["X"].tolist()),
                max(data["X"].tolist()),
                min(data["Y"].tolist()),
                max(data["Y"].tolist()),
                min(data["Z"].tolist()),
                max(data["Z"].tolist()),
            ]
    
    s = dict(style=style, 
                    width=width,
                    height=height,
                    z_scale=z_scale,
                    wheel_precision=wheel_precision,
                    extents=extents,
                    time=time,
                    data=data)
    return s

def mbrs_schema(
        array: str,
        style: str,
        width: Optional[float] = 800,
        height: Optional[float] = 600,
        z_scale: Optional[float] = 0.2,
        wheel_precision: Optional[float] = 50):
    """Create a Dict to be passed on to BabylonMBRS to create a 3D point cloud visualization.
    """
    
    [data,extents] = fragment_mbrs(array)
    
    s = dict(style=style, 
                    width=width,
                    height=height,
                    z_scale=z_scale,
                    wheel_precision=wheel_precision,
                    extents=extents,
                    data=data)               
    return s

class Show:
    """Create a 3D visualization.

    Parameters:
        ...
    """
    @classmethod
    def from_dict(self,
        data: dict,
        style: str,
        width: Optional[float] = 800,
        height: Optional[float] = 600,
        z_scale: Optional[float] = 0.2,
        wheel_precision: Optional[float] = 50,
        time: Optional[bool] = None,
    ):
        if style == 'pointcloud': 
            dataviz = BabylonPC()
            dataviz.value = pointcloud_schema(data,style,width,height,z_scale,wheel_precision,time)
            display(dataviz)

    @classmethod
    def from_array(self,
        array: str,
        style: str,
        width: Optional[float] = 800,
        height: Optional[float] = 600,
        z_scale: Optional[float] = 0.2,
        wheel_precision: Optional[float] = 50,
    ):
        if style == 'mbrs':
            dataviz = BabylonMBRS()
            dataviz.value = mbrs_schema(array,style,width,height,z_scale,wheel_precision)
            display(dataviz)