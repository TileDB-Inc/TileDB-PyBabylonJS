# Copyright 2022 TileDB Inc.
# Licensed under the MIT License.
"""Classes for setting up the visualization."""

from .babylonjs import BabylonPC, BabylonMBRS
from IPython.display import display

def fragment_mbrs(array):
    
    import pandas as pd
    import tiledb

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
            df = df.append(box_dict, ignore_index=True)

    df['H'] = (df['zmax']-df['zmin']) / (df['zmax'].max() - min(df['zmin']))
    df['W'] = (df['xmax']-df['xmin']) / (df['xmax'].max() - df['xmin'].min()) 
    df['D'] = (df['ymax']-df['ymin']) / (df['ymax'].max() - df['ymin'].min())
    df['X'] = (df['xmin']-df['xmin'].min() ) / (df['xmax'].max() - df['xmin'].min())
    df['Y'] = (df['ymin']-df['ymin'].min() ) / (df['ymax'].max() - df['ymin'].min())
    df['Z'] = (df['zmin']-df['zmin'].min() ) / (df['zmax'].max() - df['zmin'].min())

    data = {
    'X': df['X'],
    'Y': df['Y'],
    'Z': df['Z'],
    'H': df['H'],
    'W': df['W'],
    'D': df['D'],
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
        width: float,
        height: float,
        z_scale: float):
    """Create a Dict to be passed on to BabylonPC to create a 3D point cloud visualization.
    """
    
    #TODO: add check if X,Y and Z exist
    #TODO: check if works for 4D point cloud - add "add"

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
                    extents=extents,
                    data=data)
    return s

def mbrs_schema(
        array: str,
        style: str,
        width: float,
        height: float,
        z_scale: float):
    """Create a Dict to be passed on to BabylonMBRS to create a 3D point cloud visualization.
    """
    
    [data,extents] = fragment_mbrs(array)
    
    s = dict(style=style, 
                    width=width,
                    height=height,
                    z_scale=z_scale,
                    extents=extents,
                    data=data)               
    return s

class Visualize3D:
    """Create a 3D visualization.

    Parameters:
        ...
    """
    @classmethod
    def from_data(self,
        data: dict,
        style: str,
        width: float,
        height: float,
        z_scale: float,
    ):
        if style == 'pointcloud': 
            dataviz = BabylonPC()
            dataviz.value = pointcloud_schema(data,style,width,height,z_scale)
            display(dataviz)

    @classmethod
    def from_array(self,
        array: str,
        style: str,
        width: float,
        height: float,
        z_scale: float,
    ):
        if style == 'mbrs':
            dataviz = BabylonMBRS()
            dataviz.value = mbrs_schema(array,style,width,height,z_scale)
            display(dataviz)
