// Copyright 2022 TileDB Inc.
// Licensed under the MIT License.

import Client from '@tiledb-inc/tiledb-cloud';
import { Layout } from '@tiledb-inc/tiledb-cloud/lib/v1';

export function setPointCloudSwitches(mode: string){
    var isTime = false;
    var isClass = false;
    var isTopo = false;
    var isGltf = false;

    if (mode === "time"){
      isTime = true;
    }else if (mode === "classes") {
      isClass = true;
    }else if(mode == "topo"){
      isTopo = true;
    }else if(mode == "gltf"){
      isGltf = true;
    //}else if(mode == "pcl"){
    //    isPCL = true;
    }  
    return {isTime, isClass, isTopo, isGltf}
  }

export async function getPointCloud(values: any){
        
    var dataIn: any
    var data: any

    if (values.source === "cloud"){
      var dataUnsorted = await loadPointCloud(values).then((results) => {return results});        
      if (values.mode === "time"){
      dataIn = sortDataArrays(dataUnsorted);
    }else{
      dataIn = dataUnsorted;
    }
    }else{
      dataIn = values.data;
    }
  
  if (values.show_fraction){ 
    data = reduceDataArrays(dataIn, values.show_fraction);
  }else{
    data = dataIn;
  }

  if (values.origin_shift_x){
    data.X = data.X.map((n: any) => n + values.origin_shift_x);
  }
  if (values.origin_shift_y){
    data.Y = data.Y.map((n: any) => n + values.origin_shift_y);
  }
  if (values.origin_shift_z){
    data.Z = data.Z.map((n: any) => n + values.origin_shift_z);
  }
      
  const {xmin, xmax, ymin, ymax, rgbMax} = getPointCloudLimits(values, data);

  return {data, xmin, xmax, ymin, ymax, rgbMax};
 }
    
function getPointCloudLimits(values: any, data: any){
        
  var xmin: number;
  var xmax: number;
  var ymin: number; 
  var ymax: number;
  var rgbMax: number;
  
  if (values.bbox) {
    xmin = values.bbox.X[0];
    xmax = values.bbox.X[1];
    ymin = values.bbox.Y[0];
    ymax = values.bbox.Y[1];
  }
  else {
    xmin = data.X.reduce((accum: number, currentNumber: number) => Math.min(accum, currentNumber));
    xmax = data.X.reduce((accum: number, currentNumber: number) => Math.max(accum, currentNumber));
    ymin = data.Y.reduce((accum: number, currentNumber: number) => Math.min(accum, currentNumber));
    ymax = data.Y.reduce((accum: number, currentNumber: number) => Math.max(accum, currentNumber));
  }    

  if (values.rgb_max) {
    rgbMax = values.rgb_max;
  }
  else {
    const redmax = data.Red.reduce((accum: number, currentNumber: number) => Math.max(accum, currentNumber));
    const greenmax = data.Green.reduce((accum: number, currentNumber: number) => Math.max(accum, currentNumber));
    const bluemax = data.Blue.reduce((accum: number, currentNumber: number) => Math.max(accum, currentNumber));
    rgbMax = Math.max(redmax, greenmax, bluemax);
  } 
  return {xmin, xmax, ymin, ymax, rgbMax};
}

async function loadPointCloud(values: {name_space: string, array_name: string, bbox: { X: number[], Y: number[], Z: number[]}, token: string, tiledb_env: string}) {

  const config: Record<string, any> = {};
    
  config.apiKey = values.token;
  
  if (values.tiledb_env){
    config.basePath = values.tiledb_env;
  }
  
  const tiledbClient = new Client(config);
  
  const query: { layout: any, ranges: number[][], bufferSize: number, attributes: any} = {
    layout: Layout.Unordered,
    ranges: [values.bbox.X, values.bbox.Y, values.bbox.Z],
    bufferSize: 150000000000,
    attributes: ['X','Y','Z','Red','Green','Blue','GpsTime','Classification']
  };
  
  for await (let results of tiledbClient.query.ReadQuery(
    values.name_space,
    values.array_name,
    query
   )) {
    return results;
  }    
}  


function sortDataArrays(data: any){
  
  const GpsTime = data.GpsTime;
  const X = data.X;
  const Y = data.Y;
  const Z = data.Z;
  const Red = data.Red;
  const Green = data.Green;
  const Blue = data.Blue;
  
  const sortedData = sortArrays({GpsTime, X, Y, Z, Red, Green, Blue});
  
  return sortedData;
  
}        
  
  
function sortArrays(arrays: any, comparator = (a: number, b: number) => (a < b) ? -1 : (a > b) ? 1 : 0) {
    
  const arrayKeys = Object.keys(arrays);
  const [sortableArray] = Object.values(arrays) as any[];
  const indexes = Object.keys(sortableArray);
  const sortedIndexes = indexes.sort((a, b) => comparator(sortableArray[a], sortableArray[b]));
  
  const sortByIndexes = (array: { [x: string]: any; }, sortedIndexes: any[]) => sortedIndexes.map(sortedIndex => array[sortedIndex]);
  
  if (Array.isArray(arrays)) {
    return arrayKeys.map((arrayIndex: string) => sortByIndexes(arrays[arrayIndex as any], sortedIndexes));
  } else {
    const sortedArrays: any = {};
    arrayKeys.forEach((arrayKey) => {
      sortedArrays[arrayKey] = sortByIndexes(arrays[arrayKey as any], sortedIndexes) as any;
    });
    return sortedArrays;
  }
}
  
  
function reduceDataArrays(data: any, show_fraction: number){
  
  const GpsTime = data.GpsTime;
  const X = data.X;
  const Y = data.Y;
  const Z = data.Z;
  const Red = data.Red;
  const Green = data.Green;
  const Blue = data.Blue;

  const reducedData = reduceArrays({GpsTime, X, Y, Z, Red, Green, Blue}, show_fraction);

  return reducedData;
}
  
  
function reduceArrays(arrays: any, show_fraction: number){
  
  const arrayKeys = Object.keys(arrays);
  const reducedArrays: any = {};
  
  for (let arrayKey of arrayKeys) {
    if (Array.isArray(arrays[arrayKey])){
      reducedArrays[arrayKey] = arrays[arrayKey].filter(function(value: any, index: any, Arr: any) {
        return index % show_fraction == 0;  
      });
    }      
  }
  
  return reducedArrays;
}  