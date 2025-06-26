#!/usr/bin/env python3
import subprocess
import sys
import os

def install_package(package):
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])

# 检查并安装geopandas
try:
    import geopandas as gpd
    print('geopandas is available')
except ImportError:
    print('Installing geopandas...')
    install_package('geopandas')
    import geopandas as gpd

# 读取shapefile
print('Reading shapefile...')
shapefile_path = 'lfsa000a21a_e/lfsa000a21a_e.shp'

if not os.path.exists(shapefile_path):
    print(f'Error: {shapefile_path} not found')
    sys.exit(1)

# 加载数据
gdf = gpd.read_file(shapefile_path)
print(f'Loaded {len(gdf)} FSA boundaries')
print('Columns:', list(gdf.columns))
print('\nSample data:')
print(gdf.head())

# 检查当前坐标系
print(f'\nCurrent CRS: {gdf.crs}')

# 转换为WGS84坐标系 (EPSG:4326) 以便在web地图中使用
if gdf.crs != 'EPSG:4326':
    print('Converting to EPSG:4326...')
    gdf = gdf.to_crs('EPSG:4326')

# 保存为GeoJSON
output_file = 'canada_fsa_boundaries.geojson'
print(f'Saving to {output_file}...')
gdf.to_file(output_file, driver='GeoJSON')

# 检查文件大小
file_size = os.path.getsize(output_file) / (1024 * 1024)  # MB
print(f'Saved successfully! File size: {file_size:.2f} MB')

# 显示一些FSA统计信息
print(f'\nFSA Statistics:')
print(f'Total FSAs: {len(gdf)}')
if 'PRUID' in gdf.columns:
    print('FSAs by Province:')
    print(gdf['PRUID'].value_counts().sort_index())

if 'CFSAUID' in gdf.columns:
    print('\nSample FSA codes:')
    print(gdf['CFSAUID'].head(10).tolist()) 